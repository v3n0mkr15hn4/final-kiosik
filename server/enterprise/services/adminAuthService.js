import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { DASHBOARD_BY_ROLE } from '../config/constants.js';
import { writeAuditLog, writeSecurityIncident } from './auditService.js';
import { generateSessionId, hashToken, signAdminAccessToken, signAdminRefreshToken, verifyJwt } from './tokenService.js';

function normalizeIdentifier(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeMfaCode(code) {
  return String(code || '').replace(/\D/g, '').slice(0, 6);
}

function hashMfaCode(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}

export function lookupAdminByIdentifier(db, identifier) {
  const normalized = normalizeIdentifier(identifier);
  return db.prepare(`
    SELECT
      u.*, r.code AS role_code, r.scope AS role_scope, r.name AS role_name,
      o.name AS organization_name,
      d.name AS department_name
    FROM admin_users u
    JOIN admin_roles r ON r.id = u.role_id
    LEFT JOIN organizations o ON o.id = u.organization_id
    LEFT JOIN departments d ON d.id = u.department_id
    WHERE LOWER(u.employee_id) = ? OR LOWER(u.official_email) = ?
    LIMIT 1
  `).get(normalized, normalized);
}

export function getPermissionsForRole(db, roleId) {
  return db.prepare(`
    SELECT p.code
    FROM admin_role_permissions rp
    JOIN admin_permissions p ON p.id = rp.permission_id
    WHERE rp.role_id = ?
  `).all(roleId).map((r) => r.code);
}

function logLoginAttempt(db, data) {
  db.prepare(`
    INSERT INTO admin_login_logs
    (id, admin_user_id, attempted_identifier, status, reason, ip_address, user_agent, device_fingerprint, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    crypto.randomUUID(),
    data.adminUserId || null,
    data.attemptedIdentifier,
    data.status,
    data.reason || null,
    data.ipAddress || null,
    data.userAgent || null,
    data.deviceFingerprint || null,
    new Date().toISOString()
  );
}

function detectSuspiciousLogin(db, adminUserId, ipAddress, deviceFingerprint) {
  const recentFailed = db.prepare(`
    SELECT COUNT(*) AS c
    FROM admin_login_logs
    WHERE attempted_identifier IN (
      SELECT employee_id FROM admin_users WHERE id = ?
      UNION
      SELECT official_email FROM admin_users WHERE id = ?
    )
      AND status = 'failed'
      AND datetime(created_at) > datetime('now', '-15 minutes')
  `).get(adminUserId, adminUserId).c;

  const knownDevice = db.prepare(`
    SELECT COUNT(*) AS c FROM admin_login_logs
    WHERE admin_user_id = ? AND status = 'success' AND device_fingerprint = ?
  `).get(adminUserId, deviceFingerprint).c > 0;

  const knownIp = db.prepare(`
    SELECT COUNT(*) AS c FROM admin_login_logs
    WHERE admin_user_id = ? AND status = 'success' AND ip_address = ?
  `).get(adminUserId, ipAddress).c > 0;

  return {
    suspicious: recentFailed >= 5 || !knownDevice || !knownIp,
    reason: recentFailed >= 5
      ? 'Brute force pattern detected'
      : (!knownDevice ? 'New device fingerprint detected' : 'New IP address detected'),
  };
}

export function initiateAdminLogin(db, { identifier, password, context }) {
  const admin = lookupAdminByIdentifier(db, identifier);

  if (!admin || admin.status !== 'active') {
    logLoginAttempt(db, {
      attemptedIdentifier: normalizeIdentifier(identifier),
      status: 'failed',
      reason: 'Unknown identifier or inactive account',
      ...context,
    });

    throw new Error('Invalid admin credentials.');
  }

  const passwordMatches = bcrypt.compareSync(password, admin.password_hash);
  if (!passwordMatches) {
    logLoginAttempt(db, {
      attemptedIdentifier: normalizeIdentifier(identifier),
      adminUserId: admin.id,
      status: 'failed',
      reason: 'Wrong password',
      ...context,
    });

    const suspicious = detectSuspiciousLogin(db, admin.id, context.ipAddress, context.deviceFingerprint);
    if (suspicious.suspicious) {
      writeSecurityIncident(db, {
        incidentType: 'admin_login_anomaly',
        severity: 'high',
        actorId: admin.id,
        ipAddress: context.ipAddress,
        details: { reason: suspicious.reason, identifier: normalizeIdentifier(identifier) },
      });
    }

    throw new Error('Invalid admin credentials.');
  }

  const mfaCode = String(Math.floor(100000 + Math.random() * 900000));
  const mfaTokenId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  db.prepare(`
    INSERT INTO mfa_tokens
    (id, admin_user_id, code_hash, expires_at, created_at, ip_address, device_fingerprint)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    mfaTokenId,
    admin.id,
    hashMfaCode(mfaCode),
    expiresAt,
    new Date().toISOString(),
    context.ipAddress,
    context.deviceFingerprint
  );

  logLoginAttempt(db, {
    attemptedIdentifier: normalizeIdentifier(identifier),
    adminUserId: admin.id,
    status: 'mfa_pending',
    reason: 'Password verified, MFA required',
    ...context,
  });

  writeAuditLog(db, {
    actorType: 'admin',
    actorId: admin.id,
    eventType: 'auth',
    action: 'admin_login_mfa_issued',
    metadata: { identifier: normalizeIdentifier(identifier) },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return {
    mfaTokenId,
    expiresAt,
    deliveryHint: admin.official_email,
    ...(process.env.NODE_ENV !== 'production' ? { devMfaCode: mfaCode } : {}),
  };
}

export function completeAdminMfa(db, { mfaTokenId, mfaCode, context }) {
  const code = normalizeMfaCode(mfaCode);

  const tokenRow = db.prepare(`
    SELECT t.*, u.employee_id, u.full_name, u.organization_id, u.department_id,
           u.official_email, u.role_id, r.code AS role_code, r.scope AS role_scope,
           o.name AS organization_name, d.name AS department_name
    FROM mfa_tokens t
    JOIN admin_users u ON u.id = t.admin_user_id
    JOIN admin_roles r ON r.id = u.role_id
    LEFT JOIN organizations o ON o.id = u.organization_id
    LEFT JOIN departments d ON d.id = u.department_id
    WHERE t.id = ?
    LIMIT 1
  `).get(mfaTokenId);

  if (!tokenRow) {
    throw new Error('Invalid MFA token.');
  }

  if (tokenRow.consumed_at) {
    throw new Error('MFA token already used.');
  }

  if (new Date(tokenRow.expires_at).getTime() < Date.now()) {
    throw new Error('MFA token expired.');
  }

  if (hashMfaCode(code) !== tokenRow.code_hash) {
    logLoginAttempt(db, {
      attemptedIdentifier: tokenRow.employee_id,
      adminUserId: tokenRow.admin_user_id,
      status: 'failed',
      reason: 'Wrong MFA code',
      ...context,
    });
    throw new Error('Invalid MFA code.');
  }

  db.prepare('UPDATE mfa_tokens SET consumed_at = ? WHERE id = ?').run(new Date().toISOString(), mfaTokenId);

  const permissions = getPermissionsForRole(db, tokenRow.role_id);
  const admin = {
    id: tokenRow.admin_user_id,
    employee_id: tokenRow.employee_id,
    full_name: tokenRow.full_name,
    organization_id: tokenRow.organization_id,
    department_id: tokenRow.department_id,
    role_code: tokenRow.role_code,
    role_scope: tokenRow.role_scope,
    permissions,
  };

  const sessionId = generateSessionId();
  const accessToken = signAdminAccessToken(admin);
  const refresh = signAdminRefreshToken(admin, sessionId);

  db.prepare(`
    INSERT INTO admin_sessions
    (id, admin_user_id, refresh_token_hash, device_fingerprint, ip_address, user_agent, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    sessionId,
    admin.id,
    hashToken(refresh.token),
    context.deviceFingerprint,
    context.ipAddress,
    context.userAgent,
    refresh.expiresAt,
    new Date().toISOString()
  );

  db.prepare('UPDATE admin_users SET last_login_at = ?, updated_at = ? WHERE id = ?').run(
    new Date().toISOString(),
    new Date().toISOString(),
    admin.id
  );

  logLoginAttempt(db, {
    attemptedIdentifier: tokenRow.employee_id,
    adminUserId: admin.id,
    status: 'success',
    reason: 'MFA verified',
    ...context,
  });

  writeAuditLog(db, {
    actorType: 'admin',
    actorId: admin.id,
    eventType: 'auth',
    action: 'admin_login_success',
    metadata: { role: admin.role_code },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return {
    accessToken,
    refreshToken: refresh.token,
    accessTokenType: 'Bearer',
    dashboardPath: DASHBOARD_BY_ROLE[admin.role_code] || '/admin/super',
    admin: {
      id: admin.id,
      employeeId: admin.employee_id,
      fullName: admin.full_name,
      role: admin.role_code,
      permissions,
      organizationId: tokenRow.organization_id,
      organizationName: tokenRow.organization_name,
      departmentId: tokenRow.department_id,
      departmentName: tokenRow.department_name,
    },
  };
}

export function rotateAdminRefreshToken(db, { refreshToken, context }) {
  const payload = verifyJwt(refreshToken, 'refresh');

  const session = db.prepare(`
    SELECT s.*, u.employee_id, u.full_name, u.organization_id, u.department_id, u.role_id,
           r.code AS role_code, r.scope AS role_scope
    FROM admin_sessions s
    JOIN admin_users u ON u.id = s.admin_user_id
    JOIN admin_roles r ON r.id = u.role_id
    WHERE s.id = ?
    LIMIT 1
  `).get(payload.sessionId);

  if (!session || session.revoked_at) {
    throw new Error('Invalid admin session.');
  }

  if (new Date(session.expires_at).getTime() < Date.now()) {
    throw new Error('Admin session expired.');
  }

  if (session.refresh_token_hash !== hashToken(refreshToken)) {
    writeSecurityIncident(db, {
      incidentType: 'refresh_token_reuse',
      severity: 'critical',
      actorId: session.admin_user_id,
      ipAddress: context.ipAddress,
      details: {
        sessionId: session.id,
        message: 'Refresh token hash mismatch detected',
      },
    });
    throw new Error('Invalid refresh token.');
  }

  db.prepare('UPDATE admin_sessions SET revoked_at = ? WHERE id = ?').run(new Date().toISOString(), session.id);

  const permissions = getPermissionsForRole(db, session.role_id);
  const admin = {
    id: session.admin_user_id,
    employee_id: session.employee_id,
    full_name: session.full_name,
    organization_id: session.organization_id,
    department_id: session.department_id,
    role_code: session.role_code,
    role_scope: session.role_scope,
    permissions,
  };

  const newSessionId = generateSessionId();
  const accessToken = signAdminAccessToken(admin);
  const refresh = signAdminRefreshToken(admin, newSessionId);

  db.prepare(`
    INSERT INTO admin_sessions
    (id, admin_user_id, refresh_token_hash, device_fingerprint, ip_address, user_agent, expires_at, created_at, rotated_from_session_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    newSessionId,
    admin.id,
    hashToken(refresh.token),
    context.deviceFingerprint,
    context.ipAddress,
    context.userAgent,
    refresh.expiresAt,
    new Date().toISOString(),
    session.id
  );

  writeAuditLog(db, {
    actorType: 'admin',
    actorId: admin.id,
    eventType: 'auth',
    action: 'admin_refresh_rotated',
    metadata: { previousSessionId: session.id, newSessionId },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return {
    accessToken,
    refreshToken: refresh.token,
    accessTokenType: 'Bearer',
  };
}

export function logoutAdminSession(db, { refreshToken, actorId }) {
  if (!refreshToken) return;
  try {
    const payload = verifyJwt(refreshToken, 'refresh');
    db.prepare('UPDATE admin_sessions SET revoked_at = ? WHERE id = ?').run(new Date().toISOString(), payload.sessionId);

    if (actorId) {
      writeAuditLog(db, {
        actorType: 'admin',
        actorId,
        eventType: 'auth',
        action: 'admin_logout',
      });
    }
  } catch {
    // no-op for invalid or expired token
  }
}
