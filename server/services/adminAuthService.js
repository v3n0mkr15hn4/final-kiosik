import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { ADMIN_DASHBOARD_PATHS } from '../config/enterpriseRbac.js';

const ACCESS_TTL = process.env.ADMIN_ACCESS_TOKEN_TTL || '20m';
const REFRESH_TTL_DAYS = Number(process.env.ADMIN_REFRESH_TOKEN_DAYS || 14);

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production.');
  }
  return secret || 'suvidha-kiosk-dev-secret-2026-NOT-FOR-PRODUCTION';
}

export function hashValue(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

export function createAccessToken(adminPayload) {
  return jwt.sign(
    {
      tokenType: 'admin_access',
      sub: adminPayload.id,
      employeeId: adminPayload.employeeId,
      role: adminPayload.roleCode,
      organizationId: adminPayload.organizationId,
      departmentId: adminPayload.departmentId,
      permissions: adminPayload.permissions,
    },
    getJwtSecret(),
    { expiresIn: ACCESS_TTL }
  );
}

export function createRefreshToken(sessionId, adminId) {
  const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
  const token = jwt.sign(
    {
      tokenType: 'admin_refresh',
      sub: adminId,
      sessionId,
      expMillis: expiresAt.getTime(),
    },
    getJwtSecret(),
    { expiresIn: `${REFRESH_TTL_DAYS}d` }
  );
  return { token, expiresAt };
}

export function verifyJwtToken(token) {
  return jwt.verify(token, getJwtSecret());
}

export function generateMfaCode() {
  if (process.env.NODE_ENV !== 'production') {
    return process.env.DEV_ADMIN_MFA_CODE || '123456';
  }
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function getAdminDashboardPath(roleCode) {
  return ADMIN_DASHBOARD_PATHS[roleCode] || '/admin/super';
}

