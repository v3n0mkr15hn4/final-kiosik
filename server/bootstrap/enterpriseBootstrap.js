import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { ADMIN_PERMISSIONS, ADMIN_ROLES, ROLE_PERMISSION_MAP } from '../config/enterpriseRbac.js';

const NOW_SQL = "datetime('now')";

function execSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'departmental',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (${NOW_SQL}),
      updated_at TEXT NOT NULL DEFAULT (${NOW_SQL}),
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      queue_key TEXT NOT NULL DEFAULT 'default',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (${NOW_SQL}),
      updated_at TEXT NOT NULL DEFAULT (${NOW_SQL}),
      deleted_at TEXT,
      FOREIGN KEY (organization_id) REFERENCES organizations(id)
    );

    CREATE TABLE IF NOT EXISTS admin_roles (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (${NOW_SQL}),
      updated_at TEXT NOT NULL DEFAULT (${NOW_SQL})
    );

    CREATE TABLE IF NOT EXISTS admin_permissions (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (${NOW_SQL}),
      updated_at TEXT NOT NULL DEFAULT (${NOW_SQL})
    );

    CREATE TABLE IF NOT EXISTS admin_role_permissions (
      id TEXT PRIMARY KEY,
      role_id TEXT NOT NULL,
      permission_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (${NOW_SQL}),
      UNIQUE (role_id, permission_id),
      FOREIGN KEY (role_id) REFERENCES admin_roles(id),
      FOREIGN KEY (permission_id) REFERENCES admin_permissions(id)
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL UNIQUE,
      official_email TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role_id TEXT NOT NULL,
      organization_id TEXT,
      department_id TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      must_reset_password INTEGER NOT NULL DEFAULT 0,
      mfa_enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (${NOW_SQL}),
      updated_at TEXT NOT NULL DEFAULT (${NOW_SQL}),
      last_login_at TEXT,
      deleted_at TEXT,
      FOREIGN KEY (role_id) REFERENCES admin_roles(id),
      FOREIGN KEY (organization_id) REFERENCES organizations(id),
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS admin_department_mapping (
      id TEXT PRIMARY KEY,
      admin_user_id TEXT NOT NULL,
      organization_id TEXT NOT NULL,
      department_id TEXT NOT NULL,
      is_primary INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (${NOW_SQL}),
      UNIQUE (admin_user_id, department_id),
      FOREIGN KEY (admin_user_id) REFERENCES admin_users(id),
      FOREIGN KEY (organization_id) REFERENCES organizations(id),
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
      id TEXT PRIMARY KEY,
      admin_user_id TEXT NOT NULL,
      refresh_token_hash TEXT NOT NULL,
      device_fingerprint TEXT,
      ip_address TEXT,
      user_agent TEXT,
      expires_at TEXT NOT NULL,
      revoked_at TEXT,
      created_at TEXT NOT NULL DEFAULT (${NOW_SQL}),
      updated_at TEXT NOT NULL DEFAULT (${NOW_SQL}),
      FOREIGN KEY (admin_user_id) REFERENCES admin_users(id)
    );

    CREATE TABLE IF NOT EXISTS admin_login_logs (
      id TEXT PRIMARY KEY,
      admin_user_id TEXT,
      identifier TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      device_fingerprint TEXT,
      success INTEGER NOT NULL DEFAULT 0,
      reason TEXT,
      risk_level TEXT NOT NULL DEFAULT 'low',
      created_at TEXT NOT NULL DEFAULT (${NOW_SQL}),
      FOREIGN KEY (admin_user_id) REFERENCES admin_users(id)
    );

    CREATE TABLE IF NOT EXISTS mfa_tokens (
      id TEXT PRIMARY KEY,
      admin_user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      purpose TEXT NOT NULL DEFAULT 'login',
      expires_at TEXT NOT NULL,
      consumed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (${NOW_SQL}),
      FOREIGN KEY (admin_user_id) REFERENCES admin_users(id)
    );

    CREATE TABLE IF NOT EXISTS queues (
      id TEXT PRIMARY KEY,
      department_id TEXT NOT NULL,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      priority INTEGER NOT NULL DEFAULT 5,
      created_at TEXT NOT NULL DEFAULT (${NOW_SQL}),
      UNIQUE (department_id, code),
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS service_department_mapping (
      id TEXT PRIMARY KEY,
      service_type TEXT NOT NULL UNIQUE,
      organization_id TEXT NOT NULL,
      department_id TEXT NOT NULL,
      queue_id TEXT,
      sla_hours INTEGER NOT NULL DEFAULT 24,
      auto_escalate INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (${NOW_SQL}),
      updated_at TEXT NOT NULL DEFAULT (${NOW_SQL}),
      FOREIGN KEY (organization_id) REFERENCES organizations(id),
      FOREIGN KEY (department_id) REFERENCES departments(id),
      FOREIGN KEY (queue_id) REFERENCES queues(id)
    );

    CREATE TABLE IF NOT EXISTS applications_enterprise (
      id TEXT PRIMARY KEY,
      citizen_uid TEXT,
      citizen_name TEXT NOT NULL,
      citizen_mobile TEXT NOT NULL,
      service_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      organization_id TEXT NOT NULL,
      department_id TEXT NOT NULL,
      queue_id TEXT,
      status TEXT NOT NULL DEFAULT 'Submitted',
      priority TEXT NOT NULL DEFAULT 'normal',
      submitted_at TEXT NOT NULL DEFAULT (${NOW_SQL}),
      updated_at TEXT NOT NULL DEFAULT (${NOW_SQL}),
      created_by_kiosk_id TEXT,
      metadata_json TEXT,
      deleted_at TEXT,
      FOREIGN KEY (organization_id) REFERENCES organizations(id),
      FOREIGN KEY (department_id) REFERENCES departments(id),
      FOREIGN KEY (queue_id) REFERENCES queues(id)
    );

    CREATE TABLE IF NOT EXISTS application_documents (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      owner_department_id TEXT NOT NULL,
      storage_key TEXT NOT NULL,
      original_filename TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      byte_size INTEGER NOT NULL,
      sha256_checksum TEXT,
      encryption_key_id TEXT,
      malware_scan_status TEXT NOT NULL DEFAULT 'pending',
      verified_at TEXT,
      created_at TEXT NOT NULL DEFAULT (${NOW_SQL}),
      FOREIGN KEY (application_id) REFERENCES applications_enterprise(id),
      FOREIGN KEY (owner_department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS application_assignments (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      assigned_by_admin_id TEXT NOT NULL,
      assigned_to_admin_id TEXT NOT NULL,
      assigned_department_id TEXT NOT NULL,
      assignment_note TEXT,
      assigned_at TEXT NOT NULL DEFAULT (${NOW_SQL}),
      active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (application_id) REFERENCES applications_enterprise(id),
      FOREIGN KEY (assigned_by_admin_id) REFERENCES admin_users(id),
      FOREIGN KEY (assigned_to_admin_id) REFERENCES admin_users(id),
      FOREIGN KEY (assigned_department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS workflow_history (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      from_state TEXT,
      to_state TEXT NOT NULL,
      actor_admin_id TEXT NOT NULL,
      comment TEXT,
      created_at TEXT NOT NULL DEFAULT (${NOW_SQL}),
      FOREIGN KEY (application_id) REFERENCES applications_enterprise(id),
      FOREIGN KEY (actor_admin_id) REFERENCES admin_users(id)
    );

    CREATE TABLE IF NOT EXISTS escalation_logs (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      escalation_level INTEGER NOT NULL DEFAULT 1,
      reason TEXT,
      escalated_to_admin_id TEXT,
      created_at TEXT NOT NULL DEFAULT (${NOW_SQL}),
      FOREIGN KEY (application_id) REFERENCES applications_enterprise(id),
      FOREIGN KEY (escalated_to_admin_id) REFERENCES admin_users(id)
    );

    CREATE TABLE IF NOT EXISTS sla_tracking (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL UNIQUE,
      deadline_at TEXT NOT NULL,
      breached INTEGER NOT NULL DEFAULT 0,
      breached_at TEXT,
      reminder_sent_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (${NOW_SQL}),
      updated_at TEXT NOT NULL DEFAULT (${NOW_SQL}),
      FOREIGN KEY (application_id) REFERENCES applications_enterprise(id)
    );

    CREATE TABLE IF NOT EXISTS kiosks (
      id TEXT PRIMARY KEY,
      kiosk_code TEXT NOT NULL UNIQUE,
      location_name TEXT NOT NULL,
      city TEXT,
      state TEXT,
      organization_id TEXT,
      status TEXT NOT NULL DEFAULT 'offline',
      software_version TEXT,
      last_seen_at TEXT,
      created_at TEXT NOT NULL DEFAULT (${NOW_SQL}),
      updated_at TEXT NOT NULL DEFAULT (${NOW_SQL}),
      FOREIGN KEY (organization_id) REFERENCES organizations(id)
    );

    CREATE TABLE IF NOT EXISTS kiosk_health_logs (
      id TEXT PRIMARY KEY,
      kiosk_id TEXT NOT NULL,
      cpu_usage REAL,
      ram_usage REAL,
      storage_usage REAL,
      network_latency_ms INTEGER,
      printer_ok INTEGER DEFAULT 1,
      camera_ok INTEGER DEFAULT 1,
      microphone_ok INTEGER DEFAULT 1,
      biometric_ok INTEGER DEFAULT 1,
      heartbeat_at TEXT NOT NULL DEFAULT (${NOW_SQL}),
      FOREIGN KEY (kiosk_id) REFERENCES kiosks(id)
    );

    CREATE TABLE IF NOT EXISTS device_status (
      id TEXT PRIMARY KEY,
      kiosk_id TEXT NOT NULL,
      component TEXT NOT NULL,
      status TEXT NOT NULL,
      details TEXT,
      recorded_at TEXT NOT NULL DEFAULT (${NOW_SQL}),
      FOREIGN KEY (kiosk_id) REFERENCES kiosks(id)
    );

    CREATE TABLE IF NOT EXISTS security_incidents (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      severity TEXT NOT NULL,
      description TEXT NOT NULL,
      source_ip TEXT,
      device_fingerprint TEXT,
      kiosk_id TEXT,
      admin_user_id TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      detected_at TEXT NOT NULL DEFAULT (${NOW_SQL}),
      resolved_at TEXT,
      FOREIGN KEY (kiosk_id) REFERENCES kiosks(id),
      FOREIGN KEY (admin_user_id) REFERENCES admin_users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications_enterprise (
      id TEXT PRIMARY KEY,
      application_id TEXT,
      channel TEXT NOT NULL,
      recipient TEXT NOT NULL,
      payload_json TEXT,
      status TEXT NOT NULL DEFAULT 'queued',
      created_at TEXT NOT NULL DEFAULT (${NOW_SQL}),
      sent_at TEXT,
      FOREIGN KEY (application_id) REFERENCES applications_enterprise(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_type TEXT NOT NULL,
      actor_id TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      department_id TEXT,
      ip_address TEXT,
      user_agent TEXT,
      metadata_json TEXT,
      hash_chain TEXT,
      created_at TEXT NOT NULL DEFAULT (${NOW_SQL}),
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    CREATE INDEX IF NOT EXISTS idx_applications_department ON applications_enterprise(department_id, status, updated_at);
    CREATE INDEX IF NOT EXISTS idx_applications_org ON applications_enterprise(organization_id, status);
    CREATE INDEX IF NOT EXISTS idx_kiosk_health ON kiosk_health_logs(kiosk_id, heartbeat_at DESC);
    CREATE INDEX IF NOT EXISTS idx_security_incidents_status ON security_incidents(status, severity, detected_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_admin_login_logs_created ON admin_login_logs(created_at DESC);
  `);
}

function seedRolesAndPermissions(db) {
  const insertRole = db.prepare(`
    INSERT OR IGNORE INTO admin_roles (id, code, name, description, created_at, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
  `);
  const roleByCode = new Map();

  for (const [name, code] of Object.entries(ADMIN_ROLES)) {
    const id = randomUUID();
    insertRole.run(id, code, name.replaceAll('_', ' '), `Role: ${code}`);
  }

  const allRoles = db.prepare('SELECT id, code FROM admin_roles').all();
  for (const role of allRoles) roleByCode.set(role.code, role.id);

  const insertPermission = db.prepare(`
    INSERT OR IGNORE INTO admin_permissions (id, code, name, description, created_at, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
  `);
  const permissionByCode = new Map();
  for (const code of Object.values(ADMIN_PERMISSIONS)) {
    insertPermission.run(randomUUID(), code, code, `Permission ${code}`);
  }
  const allPermissions = db.prepare('SELECT id, code FROM admin_permissions').all();
  for (const permission of allPermissions) permissionByCode.set(permission.code, permission.id);

  const insertRolePermission = db.prepare(`
    INSERT OR IGNORE INTO admin_role_permissions (id, role_id, permission_id, created_at)
    VALUES (?, ?, ?, datetime('now'))
  `);

  for (const [roleCode, permissions] of Object.entries(ROLE_PERMISSION_MAP)) {
    const roleId = roleByCode.get(roleCode);
    if (!roleId) continue;
    for (const permissionCode of permissions) {
      const permissionId = permissionByCode.get(permissionCode);
      if (!permissionId) continue;
      insertRolePermission.run(randomUUID(), roleId, permissionId);
    }
  }
}

function seedOrganizationsAndDepartments(db) {
  const organizations = [
    { code: 'ELEC', name: 'Electricity Board' },
    { code: 'WATER', name: 'Water Department' },
    { code: 'HEALTH', name: 'Healthcare Organization' },
    { code: 'REV', name: 'Municipal Revenue Department' },
  ];
  const insertOrg = db.prepare(`
    INSERT OR IGNORE INTO organizations (id, code, name, type, active, created_at, updated_at)
    VALUES (?, ?, ?, 'departmental', 1, datetime('now'), datetime('now'))
  `);
  for (const org of organizations) {
    insertOrg.run(randomUUID(), org.code, org.name);
  }

  const orgRows = db.prepare('SELECT id, code FROM organizations').all();
  const orgByCode = Object.fromEntries(orgRows.map((row) => [row.code, row.id]));

  const departments = [
    { code: 'ELEC-OPS', name: 'Electricity Operations', orgCode: 'ELEC', queueKey: 'field-team' },
    { code: 'WATER-OPS', name: 'Water Field Team', orgCode: 'WATER', queueKey: 'field-team' },
    { code: 'HEALTH-OPS', name: 'Health Services Desk', orgCode: 'HEALTH', queueKey: 'review-desk' },
    { code: 'REV-TAX', name: 'Property Tax Cell', orgCode: 'REV', queueKey: 'revenue-desk' },
  ];

  const insertDept = db.prepare(`
    INSERT OR IGNORE INTO departments (id, organization_id, code, name, queue_key, active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
  `);
  for (const department of departments) {
    if (!orgByCode[department.orgCode]) continue;
    insertDept.run(randomUUID(), orgByCode[department.orgCode], department.code, department.name, department.queueKey);
  }

  const deptRows = db.prepare('SELECT id, code FROM departments').all();
  const insertQueue = db.prepare(`
    INSERT OR IGNORE INTO queues (id, department_id, code, name, priority, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `);
  for (const department of deptRows) {
    insertQueue.run(randomUUID(), department.id, 'default', 'Default Queue', 5);
    insertQueue.run(randomUUID(), department.id, 'field-team', 'Field Team Queue', 4);
  }
}

function seedServiceRouting(db) {
  const mappingRows = [
    { serviceType: 'electricity_complaint', departmentCode: 'ELEC-OPS', slaHours: 48 },
    { serviceType: 'water_leakage', departmentCode: 'WATER-OPS', slaHours: 24 },
    { serviceType: 'healthcare_request', departmentCode: 'HEALTH-OPS', slaHours: 72 },
    { serviceType: 'property_tax_issue', departmentCode: 'REV-TAX', slaHours: 168 },
  ];

  const deptRows = db.prepare(`
    SELECT d.id AS department_id, d.code AS department_code, d.organization_id, q.id AS queue_id
    FROM departments d
    LEFT JOIN queues q ON q.department_id = d.id AND q.code = 'field-team'
  `).all();
  const deptByCode = Object.fromEntries(deptRows.map((row) => [row.department_code, row]));

  const insertMapping = db.prepare(`
    INSERT OR IGNORE INTO service_department_mapping
    (id, service_type, organization_id, department_id, queue_id, sla_hours, auto_escalate, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
  `);

  for (const mapping of mappingRows) {
    const dept = deptByCode[mapping.departmentCode];
    if (!dept) continue;
    insertMapping.run(
      randomUUID(),
      mapping.serviceType,
      dept.organization_id,
      dept.department_id,
      dept.queue_id,
      mapping.slaHours
    );
  }
}

function ensureAdminUser(db, { employeeId, email, name, roleCode, departmentCode }) {
  const existing = db.prepare('SELECT id FROM admin_users WHERE employee_id = ?').get(employeeId);
  if (existing) return;

  const role = db.prepare('SELECT id FROM admin_roles WHERE code = ?').get(roleCode);
  const department = db.prepare('SELECT id, organization_id FROM departments WHERE code = ?').get(departmentCode);
  if (!role || !department) return;

  const password = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@2026!';
  const hash = bcrypt.hashSync(password, 12);
  const id = randomUUID();
  db.prepare(`
    INSERT INTO admin_users
    (id, employee_id, official_email, full_name, password_hash, role_id, organization_id, department_id, status, mfa_enabled, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', 1, datetime('now'), datetime('now'))
  `).run(
    id,
    employeeId,
    email,
    name,
    hash,
    role.id,
    department.organization_id,
    department.id
  );

  db.prepare(`
    INSERT OR IGNORE INTO admin_department_mapping
    (id, admin_user_id, organization_id, department_id, is_primary, created_at)
    VALUES (?, ?, ?, ?, 1, datetime('now'))
  `).run(randomUUID(), id, department.organization_id, department.id);
}

export function initEnterpriseBootstrap(db) {
  execSchema(db);
  seedRolesAndPermissions(db);
  seedOrganizationsAndDepartments(db);
  seedServiceRouting(db);

  ensureAdminUser(db, {
    employeeId: 'EMP-SUPER-001',
    email: 'super.admin@suvidha.gov.in',
    name: 'Super Admin',
    roleCode: ADMIN_ROLES.SUPER_ADMIN,
    departmentCode: 'REV-TAX',
  });
  ensureAdminUser(db, {
    employeeId: 'EMP-KIOSK-001',
    email: 'kiosk.admin@suvidha.gov.in',
    name: 'Kiosk Operations Admin',
    roleCode: ADMIN_ROLES.KIOSK_ADMIN,
    departmentCode: 'REV-TAX',
  });
  ensureAdminUser(db, {
    employeeId: 'EMP-SEC-001',
    email: 'security.analyst@suvidha.gov.in',
    name: 'SOC Analyst',
    roleCode: ADMIN_ROLES.SECURITY_ANALYST,
    departmentCode: 'REV-TAX',
  });
  ensureAdminUser(db, {
    employeeId: 'EMP-WATER-HEAD',
    email: 'water.head@suvidha.gov.in',
    name: 'Water Department Head',
    roleCode: ADMIN_ROLES.DEPARTMENT_HEAD,
    departmentCode: 'WATER-OPS',
  });
}

