-- SUVIDHA 2026 Enterprise MySQL Schema
-- Engine: InnoDB, Charset: utf8mb4, Collation: utf8mb4_unicode_ci
-- UUID strategy: CHAR(36) with application-generated UUIDv4

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS organizations (
  id CHAR(36) PRIMARY KEY,
  code VARCHAR(32) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  org_type VARCHAR(64) NOT NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS departments (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  code VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(64) NOT NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  CONSTRAINT fk_departments_org FOREIGN KEY (organization_id) REFERENCES organizations(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS roles (
  id CHAR(36) PRIMARY KEY,
  code VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(128) NOT NULL,
  scope ENUM('global','organization','department','kiosk','security','audit') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS permissions (
  id CHAR(36) PRIMARY KEY,
  code VARCHAR(128) NOT NULL UNIQUE,
  description VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id CHAR(36) NOT NULL,
  permission_id CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id),
  CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  role_id CHAR(36) NOT NULL,
  organization_id CHAR(36) NULL,
  department_id CHAR(36) NULL,
  aadhaar_uid_hash CHAR(64) NULL,
  mobile VARCHAR(16) NULL,
  email VARCHAR(255) NULL,
  full_name VARCHAR(255) NOT NULL,
  actor_type ENUM('citizen','admin') NOT NULL,
  status ENUM('active','inactive','locked') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id),
  CONSTRAINT fk_users_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES departments(id),
  INDEX idx_users_actor_type (actor_type),
  INDEX idx_users_department (department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS organization_members (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  member_type ENUM('head','officer','staff','auditor') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_org_members_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_org_members_user FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY uq_org_member (organization_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_users (
  id CHAR(36) PRIMARY KEY,
  employee_id VARCHAR(64) NOT NULL UNIQUE,
  official_email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role_id CHAR(36) NOT NULL,
  organization_id CHAR(36) NULL,
  department_id CHAR(36) NULL,
  mfa_enabled TINYINT(1) NOT NULL DEFAULT 1,
  status ENUM('active','inactive','locked') NOT NULL DEFAULT 'active',
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  CONSTRAINT fk_admin_users_role FOREIGN KEY (role_id) REFERENCES roles(id),
  CONSTRAINT fk_admin_users_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_admin_users_department FOREIGN KEY (department_id) REFERENCES departments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_roles (
  id CHAR(36) PRIMARY KEY,
  code VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(128) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_permissions (
  id CHAR(36) PRIMARY KEY,
  code VARCHAR(128) NOT NULL UNIQUE,
  description VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_role_permissions (
  admin_role_id CHAR(36) NOT NULL,
  admin_permission_id CHAR(36) NOT NULL,
  PRIMARY KEY (admin_role_id, admin_permission_id),
  CONSTRAINT fk_admin_role_permissions_role FOREIGN KEY (admin_role_id) REFERENCES admin_roles(id),
  CONSTRAINT fk_admin_role_permissions_perm FOREIGN KEY (admin_permission_id) REFERENCES admin_permissions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_department_mapping (
  id CHAR(36) PRIMARY KEY,
  admin_user_id CHAR(36) NOT NULL,
  organization_id CHAR(36) NOT NULL,
  department_id CHAR(36) NOT NULL,
  is_primary TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_admin_dept_mapping_user FOREIGN KEY (admin_user_id) REFERENCES admin_users(id),
  CONSTRAINT fk_admin_dept_mapping_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_admin_dept_mapping_dept FOREIGN KEY (department_id) REFERENCES departments(id),
  UNIQUE KEY uq_admin_dept_mapping (admin_user_id, department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_sessions (
  id CHAR(36) PRIMARY KEY,
  admin_user_id CHAR(36) NOT NULL,
  refresh_token_hash CHAR(64) NOT NULL,
  device_fingerprint VARCHAR(255) NULL,
  ip_address VARCHAR(64) NULL,
  user_agent VARCHAR(512) NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP NULL,
  rotated_from_session_id CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_admin_sessions_user FOREIGN KEY (admin_user_id) REFERENCES admin_users(id),
  INDEX idx_admin_sessions_user (admin_user_id),
  INDEX idx_admin_sessions_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_login_logs (
  id CHAR(36) PRIMARY KEY,
  admin_user_id CHAR(36) NULL,
  attempted_identifier VARCHAR(255) NOT NULL,
  status ENUM('success','failed','mfa_pending') NOT NULL,
  reason VARCHAR(255) NULL,
  ip_address VARCHAR(64) NULL,
  user_agent VARCHAR(512) NULL,
  device_fingerprint VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_admin_login_logs_user FOREIGN KEY (admin_user_id) REFERENCES admin_users(id),
  INDEX idx_admin_login_logs_identifier (attempted_identifier, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS MFA_tokens (
  id CHAR(36) PRIMARY KEY,
  admin_user_id CHAR(36) NOT NULL,
  code_hash CHAR(64) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  consumed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(64) NULL,
  device_fingerprint VARCHAR(255) NULL,
  CONSTRAINT fk_mfa_tokens_user FOREIGN KEY (admin_user_id) REFERENCES admin_users(id),
  INDEX idx_mfa_tokens_user (admin_user_id, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS queues (
  id CHAR(36) PRIMARY KEY,
  department_id CHAR(36) NOT NULL,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  priority_order INT NOT NULL DEFAULT 10,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_queues_department FOREIGN KEY (department_id) REFERENCES departments(id),
  UNIQUE KEY uq_queue_department_code (department_id, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS service_department_mapping (
  id CHAR(36) PRIMARY KEY,
  service_type VARCHAR(64) NOT NULL UNIQUE,
  organization_id CHAR(36) NOT NULL,
  department_id CHAR(36) NOT NULL,
  queue_id CHAR(36) NULL,
  sla_hours INT NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_service_mapping_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_service_mapping_department FOREIGN KEY (department_id) REFERENCES departments(id),
  CONSTRAINT fk_service_mapping_queue FOREIGN KEY (queue_id) REFERENCES queues(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS kiosks (
  id CHAR(36) PRIMARY KEY,
  kiosk_code VARCHAR(64) NOT NULL UNIQUE,
  location_name VARCHAR(255) NOT NULL,
  district VARCHAR(128) NULL,
  state VARCHAR(128) NULL,
  organization_id CHAR(36) NULL,
  department_id CHAR(36) NULL,
  status ENUM('online','offline','maintenance','tampered') NOT NULL DEFAULT 'online',
  software_version VARCHAR(64) NULL,
  last_heartbeat_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  CONSTRAINT fk_kiosks_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_kiosks_department FOREIGN KEY (department_id) REFERENCES departments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS kiosk_health_logs (
  id CHAR(36) PRIMARY KEY,
  kiosk_id CHAR(36) NOT NULL,
  cpu_usage DECIMAL(5,2) NULL,
  ram_usage DECIMAL(5,2) NULL,
  storage_usage DECIMAL(5,2) NULL,
  network_status VARCHAR(64) NULL,
  printer_status VARCHAR(64) NULL,
  microphone_status VARCHAR(64) NULL,
  camera_status VARCHAR(64) NULL,
  biometric_status VARCHAR(64) NULL,
  suspicious_activity TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_kiosk_health_logs_kiosk FOREIGN KEY (kiosk_id) REFERENCES kiosks(id),
  INDEX idx_kiosk_health_logs_kiosk_time (kiosk_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS maintenance_logs (
  id CHAR(36) PRIMARY KEY,
  kiosk_id CHAR(36) NOT NULL,
  action_type ENUM('diagnostics','reboot','shutdown','update','tamper_check') NOT NULL,
  action_details JSON NULL,
  performed_by_admin_user_id CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_maintenance_logs_kiosk FOREIGN KEY (kiosk_id) REFERENCES kiosks(id),
  CONSTRAINT fk_maintenance_logs_admin FOREIGN KEY (performed_by_admin_user_id) REFERENCES admin_users(id),
  INDEX idx_maintenance_logs_kiosk_time (kiosk_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS kiosk_sync_logs (
  id CHAR(36) PRIMARY KEY,
  kiosk_id CHAR(36) NOT NULL,
  sync_status ENUM('success','failed','retrying') NOT NULL,
  batch_reference VARCHAR(255) NULL,
  failure_reason VARCHAR(512) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_kiosk_sync_logs_kiosk FOREIGN KEY (kiosk_id) REFERENCES kiosks(id),
  INDEX idx_kiosk_sync_logs_kiosk_time (kiosk_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS device_status (
  id CHAR(36) PRIMARY KEY,
  kiosk_id CHAR(36) NOT NULL,
  device_type ENUM('printer','camera','microphone','biometric','scanner') NOT NULL,
  status ENUM('healthy','warning','critical','offline') NOT NULL,
  details JSON NULL,
  recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_device_status_kiosk FOREIGN KEY (kiosk_id) REFERENCES kiosks(id),
  INDEX idx_device_status_kiosk_type (kiosk_id, device_type, recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS applications (
  id CHAR(36) PRIMARY KEY,
  request_id VARCHAR(64) NOT NULL UNIQUE,
  citizen_user_id CHAR(36) NULL,
  service_type VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  status ENUM('Submitted','Assigned','Under Review','Verification Pending','Documents Requested','Approved','Rejected','Escalated','Completed') NOT NULL DEFAULT 'Submitted',
  priority ENUM('low','normal','high','critical') NOT NULL DEFAULT 'normal',
  organization_id CHAR(36) NOT NULL,
  department_id CHAR(36) NOT NULL,
  queue_id CHAR(36) NULL,
  assigned_officer_id CHAR(36) NULL,
  sla_due_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  CONSTRAINT fk_applications_citizen FOREIGN KEY (citizen_user_id) REFERENCES users(id),
  CONSTRAINT fk_applications_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_applications_department FOREIGN KEY (department_id) REFERENCES departments(id),
  CONSTRAINT fk_applications_queue FOREIGN KEY (queue_id) REFERENCES queues(id),
  CONSTRAINT fk_applications_assigned_officer FOREIGN KEY (assigned_officer_id) REFERENCES admin_users(id),
  INDEX idx_applications_department_status (department_id, status, created_at),
  INDEX idx_applications_queue_priority (queue_id, priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS application_documents (
  id CHAR(36) PRIMARY KEY,
  application_id CHAR(36) NOT NULL,
  owner_department_id CHAR(36) NOT NULL,
  storage_key VARCHAR(512) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(128) NOT NULL,
  file_size BIGINT NOT NULL,
  sha256_hash CHAR(64) NOT NULL,
  encryption_key_ref VARCHAR(255) NOT NULL,
  malware_status ENUM('pending','clean','infected','failed') NOT NULL DEFAULT 'pending',
  verification_status ENUM('pending','verified','rejected') NOT NULL DEFAULT 'pending',
  created_by CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  CONSTRAINT fk_application_documents_app FOREIGN KEY (application_id) REFERENCES applications(id),
  CONSTRAINT fk_application_documents_department FOREIGN KEY (owner_department_id) REFERENCES departments(id),
  INDEX idx_application_documents_owner (owner_department_id, application_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS application_assignments (
  id CHAR(36) PRIMARY KEY,
  application_id CHAR(36) NOT NULL,
  department_id CHAR(36) NOT NULL,
  assigned_to_admin_user_id CHAR(36) NULL,
  queue_id CHAR(36) NULL,
  assigned_by_admin_user_id CHAR(36) NULL,
  assignment_type ENUM('auto','manual','reassign','escalation') NOT NULL DEFAULT 'auto',
  priority ENUM('low','normal','high','critical') NOT NULL DEFAULT 'normal',
  status ENUM('active','completed','cancelled') NOT NULL DEFAULT 'active',
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  CONSTRAINT fk_application_assignments_app FOREIGN KEY (application_id) REFERENCES applications(id),
  CONSTRAINT fk_application_assignments_department FOREIGN KEY (department_id) REFERENCES departments(id),
  CONSTRAINT fk_application_assignments_assignee FOREIGN KEY (assigned_to_admin_user_id) REFERENCES admin_users(id),
  CONSTRAINT fk_application_assignments_assigner FOREIGN KEY (assigned_by_admin_user_id) REFERENCES admin_users(id),
  INDEX idx_application_assignments_active (department_id, status, assigned_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS workflow_history (
  id CHAR(36) PRIMARY KEY,
  application_id CHAR(36) NOT NULL,
  previous_state VARCHAR(64) NULL,
  next_state VARCHAR(64) NOT NULL,
  actor_type ENUM('system','admin','citizen') NOT NULL,
  actor_id CHAR(36) NULL,
  comments TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_workflow_history_app FOREIGN KEY (application_id) REFERENCES applications(id),
  INDEX idx_workflow_history_app (application_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifications (
  id CHAR(36) PRIMARY KEY,
  recipient_user_id CHAR(36) NULL,
  application_id CHAR(36) NULL,
  channel ENUM('sms','email','whatsapp','in_app','kiosk') NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  payload JSON NOT NULL,
  status ENUM('queued','sent','failed') NOT NULL DEFAULT 'queued',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP NULL,
  CONSTRAINT fk_notifications_user FOREIGN KEY (recipient_user_id) REFERENCES users(id),
  CONSTRAINT fk_notifications_app FOREIGN KEY (application_id) REFERENCES applications(id),
  INDEX idx_notifications_status (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id CHAR(36) PRIMARY KEY,
  actor_type ENUM('admin','citizen','system') NOT NULL,
  actor_id CHAR(36) NULL,
  event_type VARCHAR(64) NOT NULL,
  resource_type VARCHAR(64) NULL,
  resource_id VARCHAR(128) NULL,
  action VARCHAR(128) NOT NULL,
  metadata JSON NULL,
  ip_address VARCHAR(64) NULL,
  user_agent VARCHAR(512) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_actor (actor_type, actor_id, created_at),
  INDEX idx_audit_resource (resource_type, resource_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS security_incidents (
  id CHAR(36) PRIMARY KEY,
  incident_type VARCHAR(64) NOT NULL,
  severity ENUM('low','medium','high','critical') NOT NULL,
  actor_id CHAR(36) NULL,
  ip_address VARCHAR(64) NULL,
  details JSON NULL,
  status ENUM('open','investigating','resolved') NOT NULL DEFAULT 'open',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  INDEX idx_security_incidents_status (status, severity, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS escalation_logs (
  id CHAR(36) PRIMARY KEY,
  application_id CHAR(36) NOT NULL,
  level INT NOT NULL,
  escalated_to_role VARCHAR(64) NOT NULL,
  reason VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_escalation_logs_app FOREIGN KEY (application_id) REFERENCES applications(id),
  INDEX idx_escalation_logs_app (application_id, level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS SLA_tracking (
  id CHAR(36) PRIMARY KEY,
  application_id CHAR(36) NOT NULL,
  service_type VARCHAR(64) NOT NULL,
  sla_hours INT NOT NULL,
  started_at TIMESTAMP NOT NULL,
  due_at TIMESTAMP NOT NULL,
  breached_at TIMESTAMP NULL,
  status ENUM('active','breached','met') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_sla_tracking_app FOREIGN KEY (application_id) REFERENCES applications(id),
  INDEX idx_sla_tracking_status_due (status, due_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Immutable audit log policy recommendation:
-- 1) REVOKE UPDATE, DELETE ON audit_logs/security_incidents in application DB user.
-- 2) Use append-only DB account and periodic hash-chain notarization.
