import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { randomBytes } from 'crypto';
import { verifyJwtToken } from '../services/adminAuthService.js';
import { writeAuditLog } from '../services/auditService.js';

const csrfNonceStore = new Map();

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production.');
  }
  return secret || 'suvidha-kiosk-dev-secret-2026-NOT-FOR-PRODUCTION';
}

export function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authentication required.' });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: error.name === 'TokenExpiredError' ? 'Session expired.' : 'Invalid token.',
    });
  }
}

export function verifyRefreshToken(req, res, next) {
  const token = req.body?.refreshToken || req.cookies?.admin_refresh_token;
  if (!token) return res.status(401).json({ success: false, error: 'Refresh token missing.' });

  try {
    const decoded = verifyJwtToken(token);
    if (decoded.tokenType !== 'admin_refresh') {
      return res.status(401).json({ success: false, error: 'Invalid refresh token.' });
    }
    req.refreshToken = token;
    req.refreshClaims = decoded;
    return next();
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid refresh token.' });
  }
}

export function requireRole(roles = []) {
  const roleSet = new Set(Array.isArray(roles) ? roles : [roles]);
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role || !roleSet.has(role)) {
      return res.status(403).json({ success: false, error: 'Insufficient role access.' });
    }
    return next();
  };
}

export function requirePermission(permissions = []) {
  const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
  return (req, res, next) => {
    const userPermissions = new Set(req.user?.permissions || []);
    const hasAll = requiredPermissions.every((permission) => userPermissions.has(permission) || userPermissions.has('system.all'));
    if (!hasAll) {
      return res.status(403).json({ success: false, error: 'Permission denied.' });
    }
    return next();
  };
}

export function requireDepartmentOwnership({ source = 'params', field = 'departmentId' } = {}) {
  return (req, res, next) => {
    const targetDepartment = source === 'body' ? req.body?.[field] : req.params?.[field] || req.query?.[field];
    if (!targetDepartment) return res.status(400).json({ success: false, error: 'Department context missing.' });
    if (req.user?.role === 'super_admin') return next();
    if (req.user?.departmentId !== targetDepartment) {
      return res.status(403).json({ success: false, error: 'Cross-department access blocked.' });
    }
    return next();
  };
}

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.API_RATE_LIMIT_MAX || 120),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please retry later.' },
});

export function securityHeaders(req, res, next) {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
}

export function uploadValidation(req, res, next) {
  const files = req.files || [];
  const allowedMime = new Set([
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]);
  for (const file of files) {
    if (!allowedMime.has(file.mimetype)) {
      return res.status(400).json({ success: false, error: `Unsupported file type: ${file.mimetype}` });
    }
    if (file.size > 10 * 1024 * 1024) {
      return res.status(400).json({ success: false, error: 'File exceeds 10MB limit.' });
    }
  }
  return next();
}

export function requestLogger(req, _res, next) {
  const start = Date.now();
  req._reqStart = start;
  const actor = req.user?.sub || req.user?.uid || 'anonymous';
  console.log(`[REQ] ${req.method} ${req.originalUrl} actor=${actor}`);
  next();
}

export function auditLogger(action, entityType) {
  return (req, _res, next) => {
    const db = req.app.locals.db;
    if (!db) return next();
    try {
      writeAuditLog(db, {
        actorType: req.user?.tokenType?.startsWith('admin') ? 'admin' : 'citizen',
        actorId: req.user?.sub || req.user?.uid || null,
        action,
        entityType,
        entityId: req.params?.applicationId || req.params?.id || null,
        departmentId: req.user?.departmentId || req.body?.departmentId || null,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: {
          method: req.method,
          url: req.originalUrl,
        },
      });
    } catch (error) {
      console.warn('[AUDIT LOGGER]', error.message);
    }
    next();
  };
}

export function issueCsrfToken(req, res) {
  const token = randomBytes(32).toString('hex');
  const key = req.ip || 'unknown';
  csrfNonceStore.set(key, { token, expiresAt: Date.now() + 15 * 60 * 1000 });
  res.setHeader('X-CSRF-Token', token);
  res.json({ csrfToken: token });
}

export function csrfProtection(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const key = req.ip || 'unknown';
  const stored = csrfNonceStore.get(key);
  const provided = req.headers['x-csrf-token'];
  if (!stored || stored.expiresAt < Date.now() || !provided || provided !== stored.token) {
    return res.status(403).json({ success: false, error: 'CSRF validation failed.' });
  }
  return next();
}

export const verifyToken = verifyJWT;

export function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  try {
    req.user = jwt.verify(authHeader.slice(7), getJwtSecret());
  } catch {
    req.user = null;
  }
  return next();
}

export function requireAdmin(req, res, next) {
  const isLegacyAdmin = !!req.user?.isAdmin;
  const isAdminToken = req.user?.tokenType === 'admin_access';
  if (!isLegacyAdmin && !isAdminToken) {
    return res.status(403).json({ success: false, error: 'Admin access required.' });
  }
  next();
}

export default {
  verifyJWT,
  verifyRefreshToken,
  requireRole,
  requirePermission,
  requireDepartmentOwnership,
  rateLimiter,
  securityHeaders,
  uploadValidation,
  auditLogger,
  requestLogger,
  csrfProtection,
  issueCsrfToken,
  verifyToken,
  optionalAuth,
  requireAdmin,
};

