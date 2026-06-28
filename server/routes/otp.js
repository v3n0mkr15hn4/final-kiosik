import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes, randomInt } from 'crypto';
import { formatFast2SmsActionMessage, sendFast2SmsOtp } from '../services/fast2sms.js';
import { verifyFirebaseIdToken } from '../services/firebaseAdmin.js';

const router = Router();

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 30 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;
const LOCKOUT_MS = 10 * 60 * 1000;
const MAX_SENDS_PER_WINDOW = 5;
const SEND_WINDOW_MS = 15 * 60 * 1000;

const otpStore = new Map();

const sendOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many OTP requests. Please try again later.' },
});

const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many OTP verification attempts. Please try again later.' },
});

router.use('/send-otp', sendOtpLimiter);
router.use('/verify-otp', verifyOtpLimiter);

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production.');
  }
  return secret || 'suvidha-kiosk-dev-secret-2026-NOT-FOR-PRODUCTION';
}

function isValidAadhaar(uid) {
  const clean = (uid || '').replace(/\s/g, '');
  if (!/^\d{12}$/.test(clean)) return false;
  if (/^(\d)\1{11}$/.test(clean)) return false;
  return true;
}

function normalizeMobile(mobile) {
  return String(mobile || '').replace(/\D/g, '');
}

function isValidIndianMobile(mobile) {
  return /^[6-9]\d{9}$/.test(mobile);
}

function maskMobile(mobile) {
  const normalized = normalizeMobile(mobile);
  return normalized.length === 10 ? `**-****-${normalized.slice(-4)}` : '**-****-****';
}

function formatCitizen(row) {
  return {
    uid: row.uid,
    name: row.name,
    nameHi: row.name_hi,
    nameAs: row.name_as || row.name_hi,
    dob: row.dob,
    gender: row.gender,
    mobile: row.mobile,
    email: row.email,
    address: {
      house: row.house,
      street: row.street,
      landmark: row.landmark,
      city: row.city,
      cityId: row.city_id,
      district: row.district,
      state: row.state,
      stateId: row.state_id,
      pincode: row.pincode,
      ward: row.ward,
      wardId: row.ward_id,
    },
    photo: row.photo,
    disability: row.disability,
    bloodGroup: row.blood_group,
    language: row.language,
    category: row.category,
    occupation: row.occupation,
    annualIncome: row.annual_income,
    isAdmin: !!row.is_admin,
  };
}

function hashOtp(otp, salt) {
  return createHash('sha256').update(`${otp}:${salt}`).digest('hex');
}

function getStoreKey(uid, mobile) {
  return `${uid}:${mobile}`;
}

function getRetryAfterSeconds(untilMs) {
  return Math.max(1, Math.ceil((untilMs - Date.now()) / 1000));
}

router.post('/send-otp', async (req, res) => {
  const { uid, mobile } = req.body || {};
  const cleanedUid = String(uid || '').replace(/\s/g, '');
  const cleanedMobile = normalizeMobile(mobile);

  if (!isValidAadhaar(cleanedUid)) {
    return res.status(400).json({ success: false, error: 'Invalid Aadhaar number.' });
  }

  if (!isValidIndianMobile(cleanedMobile)) {
    return res.status(400).json({ success: false, error: 'Invalid Indian mobile number.' });
  }

  const db = req.app.locals.db;
  const citizen = db.prepare('SELECT * FROM citizens WHERE uid = ?').get(cleanedUid);
  if (!citizen) {
    return res.status(404).json({ success: false, error: 'Aadhaar not found.' });
  }

  if (normalizeMobile(citizen.mobile) !== cleanedMobile) {
    return res.status(400).json({ success: false, error: 'Mobile number does not match Aadhaar records.' });
  }

  const key = getStoreKey(cleanedUid, cleanedMobile);
  const now = Date.now();
  const existing = otpStore.get(key);

  if (existing?.lockedUntil && now < existing.lockedUntil) {
    return res.status(429).json({
      success: false,
      error: 'Too many failed attempts. Try again later.',
      retryAfterSeconds: getRetryAfterSeconds(existing.lockedUntil),
    });
  }

  if (existing?.resendAllowedAt && now < existing.resendAllowedAt) {
    return res.status(429).json({
      success: false,
      error: 'Please wait before requesting another OTP.',
      retryAfterSeconds: getRetryAfterSeconds(existing.resendAllowedAt),
    });
  }

  let sendWindowStart = existing?.sendWindowStart || now;
  let sendCount = existing?.sendCount || 0;
  if (now - sendWindowStart > SEND_WINDOW_MS) {
    sendWindowStart = now;
    sendCount = 0;
  }
  if (sendCount >= MAX_SENDS_PER_WINDOW) {
    const retryAt = sendWindowStart + SEND_WINDOW_MS;
    return res.status(429).json({
      success: false,
      error: 'OTP request limit reached. Please try again later.',
      retryAfterSeconds: getRetryAfterSeconds(retryAt),
    });
  }

  const otp = String(randomInt(100000, 1000000));
  const salt = randomBytes(16).toString('hex');
  const otpHash = hashOtp(otp, salt);

  console.log('[OTP] Send request received', {
    aadhaar: `XXXX-XXXX-${cleanedUid.slice(-4)}`,
    mobile: `**-****-${cleanedMobile.slice(-4)}`,
  });

  try {
    const providerResult = await sendFast2SmsOtp({ mobile: cleanedMobile, otp });
    console.log('[OTP] SMS provider success', {
      aadhaar: `XXXX-XXXX-${cleanedUid.slice(-4)}`,
      routeUsed: providerResult.routeUsed,
      requestId: providerResult.requestId || null,
    });
  } catch (error) {
    const primaryProvider = error?.provider?.primary || error?.provider || {};
    const providerStatusCode = primaryProvider?.providerStatusCode || null;
    const providerMessage = primaryProvider?.message || error.message || 'Fast2SMS request failed.';
    const actionMessage = formatFast2SmsActionMessage(providerStatusCode, providerMessage);

    console.error('[OTP] SMS provider failed', {
      aadhaar: `XXXX-XXXX-${cleanedUid.slice(-4)}`,
      providerStatusCode,
      providerMessage,
      details: error?.provider || null,
    });

    return res.status(502).json({
      success: false,
      error: actionMessage,
      providerStatusCode,
      providerMessage,
      debug: process.env.NODE_ENV === 'development' ? (error?.provider || null) : undefined,
    });
  }

  otpStore.set(key, {
    otpHash,
    salt,
    expiresAt: now + OTP_EXPIRY_MS,
    resendAllowedAt: now + RESEND_COOLDOWN_MS,
    verifyAttempts: 0,
    sendWindowStart,
    sendCount: sendCount + 1,
    lockedUntil: 0,
  });

  return res.json({
    success: true,
    maskedMobile: maskMobile(cleanedMobile),
    resendAfterSeconds: Math.ceil(RESEND_COOLDOWN_MS / 1000),
    expiresInSeconds: Math.ceil(OTP_EXPIRY_MS / 1000),
  });
});

router.post('/verify-otp', (req, res) => {
  const { uid, mobile, otp } = req.body || {};
  const cleanedUid = String(uid || '').replace(/\s/g, '');
  const cleanedMobile = normalizeMobile(mobile);
  const cleanedOtp = String(otp || '').replace(/\D/g, '');

  if (!isValidAadhaar(cleanedUid)) {
    return res.status(400).json({ success: false, error: 'Invalid Aadhaar number.' });
  }

  if (!isValidIndianMobile(cleanedMobile)) {
    return res.status(400).json({ success: false, error: 'Invalid Indian mobile number.' });
  }

  if (!/^\d{6}$/.test(cleanedOtp)) {
    return res.status(400).json({ success: false, error: 'OTP must be a valid 6-digit number.' });
  }

  const key = getStoreKey(cleanedUid, cleanedMobile);
  const now = Date.now();
  const record = otpStore.get(key);

  if (!record) {
    return res.status(400).json({ success: false, error: 'No active OTP found. Please request OTP again.' });
  }

  if (record.lockedUntil && now < record.lockedUntil) {
    return res.status(429).json({
      success: false,
      error: 'Too many failed attempts. Try again later.',
      retryAfterSeconds: getRetryAfterSeconds(record.lockedUntil),
    });
  }

  if (now > record.expiresAt) {
    otpStore.delete(key);
    return res.status(400).json({ success: false, error: 'OTP has expired. Please request a new OTP.' });
  }

  const expectedHash = hashOtp(cleanedOtp, record.salt);
  if (expectedHash !== record.otpHash) {
    record.verifyAttempts += 1;
    if (record.verifyAttempts >= MAX_VERIFY_ATTEMPTS) {
      record.lockedUntil = now + LOCKOUT_MS;
      otpStore.set(key, record);
      return res.status(429).json({
        success: false,
        error: 'Too many invalid OTP attempts. Try again in 10 minutes.',
        retryAfterSeconds: getRetryAfterSeconds(record.lockedUntil),
      });
    }

    otpStore.set(key, record);
    const remaining = MAX_VERIFY_ATTEMPTS - record.verifyAttempts;
    console.warn('[OTP] Verification failed', {
      aadhaar: `XXXX-XXXX-${cleanedUid.slice(-4)}`,
      mobile: `**-****-${cleanedMobile.slice(-4)}`,
      remainingAttempts: remaining,
    });
    return res.status(400).json({
      success: false,
      error: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} left.`,
    });
  }

  otpStore.delete(key);

  const db = req.app.locals.db;
  const citizen = db.prepare('SELECT * FROM citizens WHERE uid = ?').get(cleanedUid);
  if (!citizen || normalizeMobile(citizen.mobile) !== cleanedMobile) {
    return res.status(401).json({ success: false, error: 'Mobile verification failed.' });
  }

  const token = jwt.sign(
    { uid: cleanedUid, name: citizen.name, isAdmin: !!citizen.is_admin },
    getJwtSecret(),
    { expiresIn: '2h' }
  );

  return res.json({
    success: true,
    data: formatCitizen(citizen),
    token,
  });
});

// ── POST /verify-firebase — Firebase Phone Auth (replaces Fast2SMS OTP verify) ──
// Client verifies OTP with Firebase SDK → gets ID token → sends here.
// We verify the token (checks phone number + expiry + signature) then issue app JWT.
router.post('/verify-firebase', verifyOtpLimiter, async (req, res) => {
  const { idToken, uid, mobile } = req.body || {};
  const cleanedUid    = String(uid    || '').replace(/\s/g, '');
  const cleanedMobile = normalizeMobile(mobile);

  if (!idToken || typeof idToken !== 'string' || idToken.length < 50) {
    return res.status(400).json({ success: false, error: 'Firebase ID token is required.' });
  }
  if (!isValidAadhaar(cleanedUid)) {
    return res.status(400).json({ success: false, error: 'Invalid Aadhaar number.' });
  }
  if (!isValidIndianMobile(cleanedMobile)) {
    return res.status(400).json({ success: false, error: 'Invalid mobile number.' });
  }

  let verifiedPhone;
  try {
    verifiedPhone = await verifyFirebaseIdToken(idToken);
  } catch (err) {
    console.warn('[OTP/Firebase] Token verification failed:', err.message);
    return res.status(401).json({ success: false, error: 'OTP verification failed. Token invalid or expired.' });
  }

  // Firebase returns E.164 (+919876543210) — strip country code for comparison
  const firebaseMobile = verifiedPhone.replace(/^\+91/, '');
  if (firebaseMobile !== cleanedMobile) {
    console.warn('[OTP/Firebase] Phone mismatch', {
      firebaseMobile: `**${firebaseMobile.slice(-4)}`,
      provided: `**${cleanedMobile.slice(-4)}`,
    });
    return res.status(401).json({ success: false, error: 'Mobile number does not match the verified phone.' });
  }

  const db = req.app.locals.db;
  const citizen = db.prepare('SELECT * FROM citizens WHERE uid = ?').get(cleanedUid);
  if (!citizen || normalizeMobile(citizen.mobile) !== cleanedMobile) {
    return res.status(401).json({ success: false, error: 'Aadhaar + mobile combination not found.' });
  }

  const token = jwt.sign(
    { uid: cleanedUid, name: citizen.name, isAdmin: !!citizen.is_admin },
    getJwtSecret(),
    { expiresIn: '2h' }
  );

  console.log('[OTP/Firebase] Login success', {
    aadhaar: `XXXX-XXXX-${cleanedUid.slice(-4)}`,
    mobile: `**-****-${cleanedMobile.slice(-4)}`,
  });

  return res.json({
    success: true,
    data: formatCitizen(citizen),
    token,
  });
});

export default router;
