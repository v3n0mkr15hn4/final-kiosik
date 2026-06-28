/**
 * Upload Routes — File upload session management
 */

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/webp',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, JPEG, PNG, and WebP are allowed.'));
    }
  }
});

const hashPin = (sessionId, pin) =>
  crypto.createHash('sha256').update(`${sessionId}:${pin}`).digest('hex');

const getPublicBaseUrl = (req) => {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const forwardedHost = req.headers['x-forwarded-host'];
  const proto = forwardedProto || req.protocol || 'http';
  const host = forwardedHost || req.get('host');
  return `${proto}://${host}`;
};

// POST /api/upload — Create upload session
router.post('/', (req, res) => {
  const db = req.app.locals.db;
  const sessionId = req.body.sessionId || `UP-${Date.now().toString(36).toUpperCase()}`;
  // Accept a client-generated pin so it matches what's already rendered on
  // the kiosk screen (QR generation no longer waits for this request to
  // complete — see QRUpload.jsx). Falls back to generating one server-side
  // only for callers that don't supply it.
  const pin = /^\d{6}$/.test(req.body.pin || '') ? req.body.pin : String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const pinHash = hashPin(sessionId, pin);

  db.prepare(`
    INSERT OR REPLACE INTO upload_sessions (session_id, pin_hash, status, expires_at, updated_at)
    VALUES (?, ?, 'active', ?, datetime('now'))
  `).run(sessionId, pinHash, expiresAt);

  const origin = req.get('origin') || 'http://localhost:3000';
  const uploadUrl = `${origin}/mobile-upload/${sessionId}`;

  return res.json({
    success: true,
    sessionId,
    uploadUrl,
    pin,
    expiresAt,
  });
});

// POST /api/upload/:sessionId/files — Upload files to a session
router.post('/:sessionId/files', upload.array('files', 5), (req, res) => {
  const { sessionId } = req.params;
  const db = req.app.locals.db;
  const publicBaseUrl = getPublicBaseUrl(req);

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, error: 'No files uploaded.' });
  }

  const files = req.files.map(f => {
    db.prepare(`
      INSERT INTO uploads (session_id, filename, original_name, mime_type, size)
      VALUES (?, ?, ?, ?, ?)
    `).run(sessionId, f.filename, f.originalname, f.mimetype, f.size);

    const encodedFilename = encodeURIComponent(f.filename);
    const relativeUrl = `/uploads/${encodedFilename}`;
    return {
      name: f.originalname,
      size: formatSize(f.size),
      type: f.mimetype,
      url: relativeUrl,
      publicUrl: `${publicBaseUrl}${relativeUrl}`,
    };
  });

  return res.json({ success: true, files });
});

// GET /api/upload/:sessionId/status — Check if files have been uploaded
router.get('/:sessionId/status', (req, res) => {
  const { sessionId } = req.params;
  const db = req.app.locals.db;
  const publicBaseUrl = getPublicBaseUrl(req);

  const session = db.prepare('SELECT * FROM upload_sessions WHERE session_id = ?').get(sessionId);
  if (!session) {
    return res.status(404).json({ success: false, error: 'Upload session not found.' });
  }

  if (session.expires_at && new Date(session.expires_at).getTime() < Date.now()) {
    return res.json({ success: true, status: 'expired', files: [] });
  }

  const files = db.prepare('SELECT * FROM uploads WHERE session_id = ?').all(sessionId);

  if (files.length === 0) {
    return res.json({ success: true, status: 'waiting', files: [] });
  }

  return res.json({
    success: true,
    status: 'complete',
    files: files.map(f => ({
      name: f.original_name,
      size: formatSize(f.size),
      type: f.mime_type,
      url: `/uploads/${encodeURIComponent(f.filename)}`,
      publicUrl: `${publicBaseUrl}/uploads/${encodeURIComponent(f.filename)}`,
    })),
  });
});

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default router;
