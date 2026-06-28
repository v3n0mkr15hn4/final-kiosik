/**
 * firebaseAdmin.js — Firebase Admin SDK singleton
 *
 * Verifies Firebase Phone Auth ID tokens issued by the client.
 * The decoded token contains the verified phone number — we cross-check
 * that against the citizen DB and issue our own app JWT.
 *
 * Env vars required (set in Render dashboard):
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY   ← paste the private key from service account JSON,
 *                            keep the -----BEGIN/END----- lines, replace literal
 *                            \n with actual newlines in Render's env var editor
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let _auth = null;

function initFirebaseAdmin() {
  if (_auth) return _auth;

  const projectId   = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey  = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('[FirebaseAdmin] Missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY — Firebase OTP verify disabled.');
    return null;
  }

  const app = getApps().length > 0
    ? getApps()[0]
    : initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });

  _auth = getAuth(app);
  console.log(`[FirebaseAdmin] Initialized — project: ${projectId}`);
  return _auth;
}

/**
 * Verify a Firebase Phone Auth ID token.
 * Returns the verified phone number (E.164, e.g. "+919876543210")
 * or throws if the token is invalid/expired.
 *
 * @param {string} idToken
 * @returns {Promise<string>} verified phone number
 */
export async function verifyFirebaseIdToken(idToken) {
  const auth = initFirebaseAdmin();
  if (!auth) throw new Error('Firebase Admin not configured.');

  const decoded = await auth.verifyIdToken(idToken);
  const phone = decoded.phone_number;
  if (!phone) throw new Error('No phone_number claim in Firebase ID token.');
  return phone;
}
