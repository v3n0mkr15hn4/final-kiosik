import { ADMIN_ROLES } from '../../enterprise/config/constants.js';

const ORG_PORTAL_ROLES = new Set([
  ADMIN_ROLES.SUPER_ADMIN,
  ADMIN_ROLES.ORGANIZATION_ADMIN,
  ADMIN_ROLES.DEPARTMENT_HEAD,
  ADMIN_ROLES.DEPARTMENT_OFFICER,
  ADMIN_ROLES.FIELD_OFFICER,
]);

const KIOSK_SYSTEM_ROLES = new Set([
  ADMIN_ROLES.SUPER_ADMIN,
  ADMIN_ROLES.KIOSK_ADMIN,
  ADMIN_ROLES.SUPPORT_STAFF,
]);

const SOC_ROLES = new Set([
  ADMIN_ROLES.SUPER_ADMIN,
  ADMIN_ROLES.SECURITY_ANALYST,
  ADMIN_ROLES.AUDITOR,
]);

function forbidden(res, message) {
  return res.status(403).json({ success: false, error: message });
}

export function requirePortalRoles(roleSet, message) {
  return (req, res, next) => {
    if (!req.auth?.roleCode) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }
    if (!roleSet.has(req.auth.roleCode)) {
      return forbidden(res, message);
    }
    return next();
  };
}

export const requireKioskSystemRole = requirePortalRoles(
  KIOSK_SYSTEM_ROLES,
  'Kiosk admin system access only. Organization workflow access is blocked.',
);

export const requireOrganizationPortalRole = requirePortalRoles(
  ORG_PORTAL_ROLES,
  'Organization portal access required.',
);

export const requireSecurityCenterRole = requirePortalRoles(
  SOC_ROLES,
  'Security operations center access required.',
);

export function requireOrganizationIsolation(resolveOrganizationId) {
  return (req, res, next) => {
    if (!req.auth) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    if (req.auth.roleCode === ADMIN_ROLES.SUPER_ADMIN) {
      return next();
    }

    const expectedOrgId = req.auth.organizationId;
    const resourceOrgId = resolveOrganizationId(req);

    if (!expectedOrgId || !resourceOrgId || expectedOrgId !== resourceOrgId) {
      return forbidden(
        res,
        'Organization isolation check failed. Cross-organization access is not allowed.',
      );
    }

    return next();
  };
}

export function requireDepartmentIsolation(resolveDepartmentId) {
  return (req, res, next) => {
    if (!req.auth) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    if (req.auth.roleCode === ADMIN_ROLES.SUPER_ADMIN || req.auth.roleCode === ADMIN_ROLES.ORGANIZATION_ADMIN) {
      return next();
    }

    const expectedDepartment = req.auth.departmentId;
    const resourceDepartment = resolveDepartmentId(req);

    if (!expectedDepartment || !resourceDepartment || expectedDepartment !== resourceDepartment) {
      return forbidden(
        res,
        'Department isolation check failed. Cross-department access is not allowed.',
      );
    }

    return next();
  };
}

export function resolveApplicationScope(db, applicationId) {
  return db
    .prepare(
      `SELECT assigned_organization_id AS organizationId, assigned_department_id AS departmentId
       FROM service_requests WHERE request_id = ?`,
    )
    .get(applicationId);
}
