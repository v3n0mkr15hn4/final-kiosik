export const ADMIN_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  KIOSK_ADMIN: 'KIOSK_ADMIN',
  ORGANIZATION_ADMIN: 'ORGANIZATION_ADMIN',
  DEPARTMENT_HEAD: 'DEPARTMENT_HEAD',
  DEPARTMENT_OFFICER: 'DEPARTMENT_OFFICER',
  FIELD_OFFICER: 'FIELD_OFFICER',
  AUDITOR: 'AUDITOR',
  SECURITY_ANALYST: 'SECURITY_ANALYST',
  SUPPORT_STAFF: 'SUPPORT_STAFF',
};

export const DASHBOARD_BY_ROLE = {
  [ADMIN_ROLES.SUPER_ADMIN]: '/super-admin',
  [ADMIN_ROLES.KIOSK_ADMIN]: '/kiosk-admin/operations',
  [ADMIN_ROLES.ORGANIZATION_ADMIN]: '/organization/electricity/dashboard',
  [ADMIN_ROLES.DEPARTMENT_HEAD]: '/organization/electricity/dashboard',
  [ADMIN_ROLES.DEPARTMENT_OFFICER]: '/organization/electricity/dashboard',
  [ADMIN_ROLES.FIELD_OFFICER]: '/organization/electricity/dashboard',
  [ADMIN_ROLES.AUDITOR]: '/security/audit',
  [ADMIN_ROLES.SECURITY_ANALYST]: '/security/operations',
  [ADMIN_ROLES.SUPPORT_STAFF]: '/kiosk-admin/operations',
};

export const WORKFLOW_STATES = {
  SUBMITTED: 'Submitted',
  ASSIGNED: 'Assigned',
  UNDER_REVIEW: 'Under Review',
  VERIFICATION_PENDING: 'Verification Pending',
  DOCUMENTS_REQUESTED: 'Documents Requested',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  ESCALATED: 'Escalated',
  COMPLETED: 'Completed',
};
