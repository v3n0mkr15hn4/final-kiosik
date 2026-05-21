import { Router } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production.');
  }
  return secret || 'suvidha-kiosk-dev-secret-2026-NOT-FOR-PRODUCTION';
}

function maskUid(uid) {
  const clean = (uid || '').replace(/\s/g, '');
  if (clean.length !== 12) return 'INVALID-UID';
  return `XXXX-XXXX-${clean.slice(-4)}`;
}

function maskMobile(mobile) {
  if (!mobile) return '**-****-****';
  const normalized = mobile.replace(/\D/g, '');
  return `**-****-${normalized.slice(-4)}`;
}

function normalizeMobile(mobile) {
  return (mobile || '').replace(/\D/g, '');
}

function isValidAadhaar(uid) {
  const clean = (uid || '').replace(/\s/g, '');
  if (!/^\d{12}$/.test(clean)) return false;
  if (/^(\d)\1{11}$/.test(clean)) return false;
  return true;
}

function formatCitizen(row, { maskContact = false } = {}) {
  return {
    uid: row.uid,
    name: row.name,
    nameHi: row.name_hi,
    nameAs: row.name_as || row.name_hi,
    dob: row.dob,
    gender: row.gender,
    mobile: maskContact ? maskMobile(row.mobile) : row.mobile,
    email: maskContact ? '****@****.***' : row.email,
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

router.post('/aadhaar/lookup', (req, res) => {
  const { uid } = req.body;

  if (!isValidAadhaar(uid)) {
    return res.status(400).json({ success: false, error: 'Invalid Aadhaar number. Must be 12 digits.' });
  }

  const cleaned = uid.replace(/\s/g, '');
  const db = req.app.locals.db;
  const row = db.prepare('SELECT * FROM citizens WHERE uid = ?').get(cleaned);

  if (!row) {
    return res.status(404).json({ success: false, error: 'Aadhaar not found. Please check the number and try again.' });
  }

  return res.json({ success: true, data: formatCitizen(row, { maskContact: true }) });
});

router.post('/aadhaar/validate-mobile', (req, res) => {
  const { uid, mobile } = req.body;

  if (!isValidAadhaar(uid)) {
    return res.status(400).json({ success: false, error: 'Invalid Aadhaar number.' });
  }

  const normalizedMobile = normalizeMobile(mobile);
  if (!/^[6-9]\d{9}$/.test(normalizedMobile)) {
    return res.status(400).json({ success: false, error: 'Invalid mobile number format.' });
  }

  const cleaned = uid.replace(/\s/g, '');
  const db = req.app.locals.db;
  const row = db.prepare('SELECT mobile FROM citizens WHERE uid = ?').get(cleaned);

  if (!row || normalizeMobile(row.mobile) !== normalizedMobile) {
    return res.status(400).json({
      success: false,
      error: 'Mobile number does not match Aadhaar records.',
    });
  }

  return res.json({
    success: true,
    maskedMobile: maskMobile(row.mobile),
  });
});

router.post('/aadhaar/verify-qr', (req, res) => {
  const { uid } = req.body;

  if (!isValidAadhaar(uid)) {
    return res.status(400).json({ success: false, error: 'Invalid Aadhaar number.' });
  }

  const cleaned = uid.replace(/\s/g, '');
  const db = req.app.locals.db;
  const citizen = db.prepare('SELECT * FROM citizens WHERE uid = ?').get(cleaned);

  if (!citizen) {
    return res.status(404).json({ success: false, error: 'QR verification failed.' });
  }

  const token = jwt.sign(
    { uid: cleaned, name: citizen.name, isAdmin: !!citizen.is_admin },
    getJwtSecret(),
    { expiresIn: '2h' }
  );

  console.log(`[AUTH] QR login: ${maskUid(cleaned)}`);
  return res.json({ success: true, data: formatCitizen(citizen), token });
});

router.post('/aadhaar/verify-biometric', (req, res) => {
  const { uid, method = 'fingerprint' } = req.body;

  if (!isValidAadhaar(uid)) {
    return res.status(400).json({ success: false, error: 'Invalid Aadhaar number.' });
  }

  const cleaned = uid.replace(/\s/g, '');
  const db = req.app.locals.db;
  const citizen = db.prepare('SELECT * FROM citizens WHERE uid = ?').get(cleaned);

  if (!citizen) {
    return res.status(404).json({ success: false, error: 'Biometric verification failed.' });
  }

  if (method === 'iris' && citizen.disability === 'visual') {
    return res.status(400).json({
      success: false,
      error: 'Iris scan not required for visually impaired citizens. Please use fingerprint verification.',
    });
  }

  const token = jwt.sign(
    { uid: cleaned, name: citizen.name, isAdmin: !!citizen.is_admin },
    getJwtSecret(),
    { expiresIn: '2h' }
  );

  console.log(`[AUTH] Biometric (${method}) login: ${maskUid(cleaned)}`);
  return res.json({ success: true, data: formatCitizen(citizen), token });
});

router.post('/admin/login', async (req, res) => {
  return res.status(410).json({
    success: false,
    error: 'Legacy admin Aadhaar login is retired. Use /api/admin-auth/login with employee ID or official email.',
  });
});

export default router;
