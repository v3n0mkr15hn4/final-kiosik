/**
 * firebaseOtp.js — Firebase Phone Auth wrapper
 *
 * Replaces Fast2SMS (cost money, needs recharge) with Firebase Phone Auth
 * (free: 10,000 SMS/month). Firebase handles SMS delivery; we just verify
 * the ID token server-side with firebase-admin.
 *
 * Flow:
 *   1. sendFirebaseOtp(mobile, buttonElement) → Firebase sends SMS free
 *   2. verifyFirebaseOtp(code) → returns Firebase ID token
 *   3. Server /api/otp/verify-firebase accepts idToken → issues app JWT
 */

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const firebaseConfig = {
  apiKey:     import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:  import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

function getFirebaseApp() {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp(firebaseConfig);
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}

let _recaptchaVerifier = null;
let _confirmationResult = null;

/**
 * Send OTP via Firebase to an Indian mobile number.
 *
 * @param {string} mobile - 10-digit Indian mobile (no country code)
 * @param {HTMLElement} buttonEl - the "Send OTP" button (invisible reCAPTCHA anchors here)
 * @returns {Promise<{ success: boolean, maskedMobile?: string, error?: string }>}
 */
export async function sendFirebaseOtp(mobile, buttonEl) {
  if (!firebaseConfig.apiKey) {
    return { success: false, error: 'Firebase not configured. Set VITE_FIREBASE_* env vars.' };
  }

  const normalised = String(mobile).replace(/\D/g, '');
  if (!/^[6-9]\d{9}$/.test(normalised)) {
    return { success: false, error: 'Invalid Indian mobile number.' };
  }

  const auth = getFirebaseAuth();
  const phoneNumber = `+91${normalised}`;

  try {
    // Tear down previous verifier if it exists
    if (_recaptchaVerifier) {
      try { _recaptchaVerifier.clear(); } catch (_) { /* ignore */ }
      _recaptchaVerifier = null;
    }

    _recaptchaVerifier = new RecaptchaVerifier(auth, buttonEl, {
      size: 'invisible',
      callback: () => { /* auto-solved — no user action needed in kiosk */ },
      'expired-callback': () => {
        if (_recaptchaVerifier) {
          try { _recaptchaVerifier.clear(); } catch (_) { /* ignore */ }
          _recaptchaVerifier = null;
        }
      },
    });

    _confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, _recaptchaVerifier);

    return {
      success: true,
      maskedMobile: `**-****-${normalised.slice(-4)}`,
      resendAfterSeconds: 30,
      expiresInSeconds: 300,
    };
  } catch (err) {
    console.error('[Firebase OTP] sendFirebaseOtp error:', err.code, err.message);
    if (_recaptchaVerifier) {
      try { _recaptchaVerifier.clear(); } catch (_) { /* ignore */ }
      _recaptchaVerifier = null;
    }
    return { success: false, error: mapFirebaseError(err.code) };
  }
}

/**
 * Verify the 6-digit code the user typed.
 *
 * @param {string} code - 6-digit OTP from user
 * @returns {Promise<{ success: boolean, idToken?: string, error?: string }>}
 */
export async function verifyFirebaseOtp(code) {
  if (!_confirmationResult) {
    return { success: false, error: 'No pending OTP. Please request a new OTP.' };
  }

  if (!/^\d{6}$/.test(String(code))) {
    return { success: false, error: 'OTP must be a 6-digit number.' };
  }

  try {
    const userCredential = await _confirmationResult.confirm(code);
    const idToken = await userCredential.user.getIdToken();
    _confirmationResult = null;
    return { success: true, idToken };
  } catch (err) {
    console.error('[Firebase OTP] verifyFirebaseOtp error:', err.code, err.message);
    return { success: false, error: mapFirebaseError(err.code) };
  }
}

function mapFirebaseError(code) {
  switch (code) {
    case 'auth/invalid-phone-number':      return 'Invalid mobile number. Use a valid 10-digit Indian number.';
    case 'auth/too-many-requests':         return 'Too many OTP attempts. Please wait a few minutes and try again.';
    case 'auth/invalid-verification-code': return 'Incorrect OTP. Please try again.';
    case 'auth/code-expired':              return 'OTP has expired. Please request a new OTP.';
    case 'auth/quota-exceeded':            return 'SMS quota reached. Please try again later.';
    case 'auth/captcha-check-failed':      return 'reCAPTCHA check failed. Please refresh and try again.';
    default:                               return `OTP error (${code || 'unknown'}). Please try again.`;
  }
}
