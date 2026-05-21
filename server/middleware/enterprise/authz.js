import rateLimit from 'express-rate-limit';
import { verifyJwt } from '../../enterprise/services/tokenService.js';

export function verifyJWT(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authentication required.' });
  }

  try {
    const token = auth.slice(7);
    const payload = verifyJwt(token, 'access');
    req.auth = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token.' });
  }
}

export function verifyRefreshToken(req, res, next) {
  const { refreshToken } = req.body || {};
  if (!refreshToken) {
    return res.status(400).json({ success: false, error: 'refreshToken is required.' });
  }

  try {
    req.refreshPayload = verifyJwt(refreshToken, 'refresh');
    return next();
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid refresh token.' });
  }
}

export function requireActorType(actorType) {
  return (req, res, next) => {
    if (!req.auth || req.auth.actorType !== actorType) {
      return res.status(403).json({ success: false, error: `Only ${actorType} accounts are allowed.` });
    }
    return next();
  };
}

export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.auth) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }
    if (!allowedRoles.includes(req.auth.roleCode)) {
      return res.status(403).json({ success: false, error: 'Insufficient role access.' });
    }
    return next();
  };
}

export function requirePermission(permissionCode) {
  return (req, res, next) => {
    if (!req.auth) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    const permissions = Array.isArray(req.auth.permissions) ? req.auth.permissions : [];
    if (!permissions.includes(permissionCode)) {
      return res.status(403).json({ success: false, error: `Missing permission: ${permissionCode}` });
    }

    return next();
  };
}

export function requireDepartmentOwnership(resolveDepartmentId) {
  return (req, res, next) => {
    if (!req.auth) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    if (req.auth.roleCode === 'SUPER_ADMIN') {
      return next();
    }

    const expectedDepartment = req.auth.departmentId;
    const resourceDepartment = resolveDepartmentId(req);

    if (!expectedDepartment || !resourceDepartment || expectedDepartment !== resourceDepartment) {
      return res.status(403).json({
        success: false,
        error: 'Department isolation check failed. Cross-department access is not allowed.',
      });
    }

    return next();
  };
}

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please try again later.' },
});
