import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { verifyJWT, verifyRefreshToken, requireActorType } from '../middleware/enterprise/authz.js';
import {
  generateSessionId,
  hashToken,
  signAdminAccessToken,
  signAdminRefreshToken,
} from '../enterprise/services/tokenService.js';

const router = Router();

const DASHBOARD_MAP = {
  SUPER_ADMIN:       '/super-admin',
  KIOSK_ADMIN:       '/kiosk-ops',
  AUDITOR:           '/security/audit',
  SECURITY_ANALYST:  '/security/ops',
  SUPPORT_STAFF:     '/kiosk-ops',
};

function orgPortalSlug(orgCode) {
  const map = {
    ELEC:      'electricity',
    WATER:     'water',
    HEALTH:    'healthcare',
    MUNI:      'municipal',
    TRANSPORT: 'transport',
    REVENUE:   'revenue',
  };
  return map[orgCode] || 'electricity';
}

function dashboardPath(roleCode, orgCode) {
  if (['ORGANIZATION_ADMIN', 'DEPARTMENT_HEAD', 'DEPARTMENT_OFFICER', 'FIELD_OFFICER'].includes(roleCode)) {
    return `/org/${orgPortalSlug(orgCode)}`;
  }
  return DASHBOARD_MAP[roleCode] || '/super-admin';
}

function loadAdmin(db, identifier) {
  return db.prepare(`
    SELECT
      u.*,
      r.code AS role_code,
      r.scope AS role_scope,
      r.name AS role_name,
      o.code AS organization_code
    FROM admin_users u
    JOIN admin_roles r ON r.id = u.role_id
    LEFT JOIN organizations o ON o.id = u.organization_id
    WHERE u.employee_id = ? OR lower(u.official_email) = lower(?)
    LIMIT 1
  `).get(identifier, identifier);
}

function loadPermissions(db, roleId) {
  return db.prepare(`
    SELECT p.code
    FROM admin_role_permissions rp
    JOIN admin_permissions p ON p.id = rp.permission_id
    WHERE rp.role_id = ?
  `).all(roleId).map((row) => row.code);
}

function logLogin(db, { adminUserId, identifier, status, reason, req }) {
  db.prepare(`
    INSERT INTO admin_login_logs
    (id, admin_user_id, attempted_identifier, status, reason, ip_address, user_agent, device_fingerprint, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(
    crypto.randomUUID(),
    adminUserId || null,
    identifier,
    status,
    reason || null,
    req.ip || null,
    req.headers['user-agent'] || null,
    req.body?.deviceFingerprint || null,
  );
}

function toAdminPayload(admin, permissions) {
  return {
    id: admin.id,
    employee_id: admin.employee_id,
    official_email: admin.official_email,
    full_name: admin.full_name,
    role_code: admin.role_code,
    role_scope: admin.role_scope,
    organization_id: admin.organization_id,
    department_id: admin.department_id,
    permissions,
  };
}

function buildAdminResponse(admin, permissions, accessToken, refreshToken) {
  const resolvedDashboardPath = dashboardPath(admin.role_code, admin.organization_code);
  return {
    success: true,
    admin: {
      id: admin.id,
      employeeId: admin.employee_id,
      officialEmail: admin.official_email,
      fullName: admin.full_name,
      role: admin.role_code,
      roleScope: admin.role_scope,
      organizationId: admin.organization_id,
      organizationCode: admin.organization_code,
      departmentId: admin.department_id,
      permissions,
      dashboardPath: resolvedDashboardPath,
    },
    tokens: {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
    },
  };
}

router.post('/login', async (req, res) => {
  const { identifier, password } = req.body || {};
  if (!identifier || !password) {
    return res.status(400).json({ success: false, error: 'Employee ID/email and password are required.' });
  }

  const db = req.app.locals.db;
  const admin = loadAdmin(db, String(identifier).trim());

  if (!admin || admin.status !== 'active') {
    logLogin(db, { identifier, status: 'failed', reason: 'account_not_found_or_inactive', req });
    return res.status(401).json({ success: false, error: 'Invalid credentials.' });
  }

  const valid = await bcrypt.compare(String(password), admin.password_hash);
  if (!valid) {
    logLogin(db, { adminUserId: admin.id, identifier, status: 'failed', reason: 'invalid_password', req });
    return res.status(401).json({ success: false, error: 'Invalid credentials.' });
  }

  const mfaCode = process.env.NODE_ENV === 'production'
    ? String(Math.floor(100000 + Math.random() * 900000))
    : (process.env.DEV_ADMIN_MFA_CODE || '123456');

  const challengeId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  db.prepare(`
    INSERT INTO mfa_tokens
    (id, admin_user_id, code_hash, expires_at, consumed_at, created_at, ip_address, device_fingerprint)
    VALUES (?, ?, ?, ?, NULL, datetime('now'), ?, ?)
  `).run(
    challengeId,
    admin.id,
    hashToken(mfaCode),
    expiresAt,
    req.ip || null,
    req.body?.deviceFingerprint || null,
  );

  logLogin(db, { adminUserId: admin.id, identifier, status: 'mfa_pending', reason: null, req });

  return res.json({
    success: true,
    mfaRequired: true,
    challengeId,
    expiresAt,
    devMfaCode: process.env.NODE_ENV !== 'production' ? mfaCode : undefined,
  });
});

router.post('/verify-mfa', (req, res) => {
  const { challengeId, mfaCode } = req.body || {};
  if (!challengeId || !mfaCode) {
    return res.status(400).json({ success: false, error: 'challengeId and mfaCode are required.' });
  }

  const db = req.app.locals.db;
  const challenge = db.prepare('SELECT * FROM mfa_tokens WHERE id = ?').get(challengeId);

  if (!challenge || challenge.consumed_at || new Date(challenge.expires_at).getTime() < Date.now()) {
    return res.status(401).json({ success: false, error: 'MFA challenge expired or invalid.' });
  }

  if (hashToken(String(mfaCode)) !== challenge.code_hash) {
    return res.status(401).json({ success: false, error: 'Invalid MFA code.' });
  }

  db.prepare("UPDATE mfa_tokens SET consumed_at = datetime('now') WHERE id = ?").run(challenge.id);
  const admin = db.prepare(`
    SELECT
      u.*,
      r.code AS role_code,
      r.scope AS role_scope,
      r.name AS role_name,
      o.code AS organization_code
    FROM admin_users u
    JOIN admin_roles r ON r.id = u.role_id
    LEFT JOIN organizations o ON o.id = u.organization_id
    WHERE u.id = ? AND u.status = 'active'
    LIMIT 1
  `).get(challenge.admin_user_id);

  if (!admin) {
    return res.status(401).json({ success: false, error: 'Admin account unavailable.' });
  }

  const permissions = loadPermissions(db, admin.role_id);
  const adminPayload = toAdminPayload(admin, permissions);
  const accessToken = signAdminAccessToken(adminPayload);
  const sessionId = generateSessionId();
  const refresh = signAdminRefreshToken(adminPayload, sessionId);

  db.prepare(`
    INSERT INTO admin_sessions
    (id, admin_user_id, refresh_token_hash, device_fingerprint, ip_address, user_agent, expires_at, revoked_at, created_at, rotated_from_session_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, NULL, datetime('now'), NULL)
  `).run(
    sessionId,
    admin.id,
    hashToken(refresh.token),
    req.body?.deviceFingerprint || null,
    req.ip || null,
    req.headers['user-agent'] || null,
    refresh.expiresAt,
  );

  db.prepare("UPDATE admin_users SET last_login_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(admin.id);
  logLogin(db, { adminUserId: admin.id, identifier: admin.employee_id, status: 'success', reason: null, req });

  return res.json(buildAdminResponse(admin, permissions, accessToken, refresh.token));
});

router.post('/refresh', verifyRefreshToken, (req, res) => {
  const db = req.app.locals.db;
  const payload = req.refreshPayload;
  const refreshToken = req.body.refreshToken;
  const session = db.prepare('SELECT * FROM admin_sessions WHERE id = ?').get(payload.sessionId);

  if (!session || session.revoked_at || new Date(session.expires_at).getTime() < Date.now()) {
    return res.status(401).json({ success: false, error: 'Session expired. Please login again.' });
  }
  if (session.refresh_token_hash !== hashToken(refreshToken)) {
    return res.status(401).json({ success: false, error: 'Refresh token mismatch.' });
  }

  const admin = db.prepare(`
    SELECT
      u.*,
      r.code AS role_code,
      r.scope AS role_scope,
      r.name AS role_name,
      o.code AS organization_code
    FROM admin_users u
    JOIN admin_roles r ON r.id = u.role_id
    LEFT JOIN organizations o ON o.id = u.organization_id
    WHERE u.id = ? AND u.status = 'active'
  `).get(session.admin_user_id);

  if (!admin) return res.status(401).json({ success: false, error: 'Admin account unavailable.' });

  const permissions = loadPermissions(db, admin.role_id);
  const adminPayload = toAdminPayload(admin, permissions);
  const accessToken = signAdminAccessToken(adminPayload);
  const newRefresh = signAdminRefreshToken(adminPayload, session.id);

  db.prepare(`
    UPDATE admin_sessions
    SET refresh_token_hash = ?, expires_at = ?, ip_address = ?, user_agent = ?
    WHERE id = ?
  `).run(
    hashToken(newRefresh.token),
    newRefresh.expiresAt,
    req.ip || null,
    req.headers['user-agent'] || null,
    session.id,
  );

  return res.json(buildAdminResponse(admin, permissions, accessToken, newRefresh.token));
});

router.post('/logout', verifyJWT, requireActorType('admin'), (req, res) => {
  const db = req.app.locals.db;
  const sessionId = req.body?.sessionId || null;

  if (sessionId) {
    db.prepare("UPDATE admin_sessions SET revoked_at = datetime('now') WHERE id = ?").run(sessionId);
  } else {
    db.prepare("UPDATE admin_sessions SET revoked_at = datetime('now') WHERE admin_user_id = ? AND revoked_at IS NULL").run(req.auth.sub);
  }

  return res.json({ success: true, message: 'Logged out successfully.' });
});

router.get('/me', verifyJWT, requireActorType('admin'), (req, res) => {
  const db = req.app.locals.db;
  const admin = db.prepare(`
    SELECT
      u.*,
      r.code AS role_code,
      r.scope AS role_scope,
      r.name AS role_name,
      o.code AS organization_code
    FROM admin_users u
    JOIN admin_roles r ON r.id = u.role_id
    LEFT JOIN organizations o ON o.id = u.organization_id
    WHERE u.id = ?
  `).get(req.auth.sub);
  if (!admin) return res.status(404).json({ success: false, error: 'Admin not found.' });

  const permissions = loadPermissions(db, admin.role_id);
  return res.json({
    success: true,
    admin: {
      id: admin.id,
      employeeId: admin.employee_id,
      officialEmail: admin.official_email,
      fullName: admin.full_name,
      role: admin.role_code,
      roleScope: admin.role_scope,
      organizationId: admin.organization_id,
      organizationCode: admin.organization_code,
      departmentId: admin.department_id,
      permissions,
      dashboardPath: dashboardPath(admin.role_code, admin.organization_code),
    },
  });
});

export default router;
