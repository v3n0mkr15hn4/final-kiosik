import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_TTL = process.env.ADMIN_ACCESS_TOKEN_TTL || '20m';
const REFRESH_TOKEN_TTL_HOURS = Number(process.env.ADMIN_REFRESH_TOKEN_TTL_HOURS || 24);

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production.');
  }
  return secret || 'suvidha-enterprise-dev-secret-2026-NOT-FOR-PRODUCTION';
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateSessionId() {
  return crypto.randomUUID();
}

export function signAdminAccessToken(admin) {
  const payload = {
    actorType: 'admin',
    sub: admin.id,
    employeeId: admin.employee_id,
    roleCode: admin.role_code,
    roleScope: admin.role_scope,
    organizationId: admin.organization_id || null,
    departmentId: admin.department_id || null,
    permissions: admin.permissions || [],
    name: admin.full_name,
    type: 'access',
  };

  return jwt.sign(payload, getJwtSecret(), { expiresIn: ACCESS_TOKEN_TTL });
}

export function signAdminRefreshToken(admin, sessionId) {
  const payload = {
    actorType: 'admin',
    sub: admin.id,
    employeeId: admin.employee_id,
    roleCode: admin.role_code,
    sessionId,
    type: 'refresh',
  };

  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_HOURS * 3600 * 1000);
  const token = jwt.sign(payload, getJwtSecret(), { expiresIn: `${REFRESH_TOKEN_TTL_HOURS}h` });

  return { token, expiresAt: expiresAt.toISOString() };
}

export function verifyJwt(token, expectedType = 'access') {
  const payload = jwt.verify(token, getJwtSecret());
  if (payload.type !== expectedType) {
    throw new Error(`Invalid token type: expected ${expectedType}`);
  }
  return payload;
}
