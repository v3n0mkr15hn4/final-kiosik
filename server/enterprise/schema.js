import bcrypt from 'bcryptjs';

export function createEnterpriseTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (organization_id) REFERENCES organizations(id)
    );

    CREATE TABLE IF NOT EXISTS queues (
      id TEXT PRIMARY KEY,
      department_id TEXT NOT NULL,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      priority_order INTEGER DEFAULT 10,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE (department_id, code),
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS service_department_mapping (
      id TEXT PRIMARY KEY,
      service_type TEXT UNIQUE NOT NULL,
      organization_id TEXT NOT NULL,
      department_id TEXT NOT NULL,
      queue_id TEXT,
      sla_hours INTEGER NOT NULL,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (organization_id) REFERENCES organizations(id),
      FOREIGN KEY (department_id) REFERENCES departments(id),
      FOREIGN KEY (queue_id) REFERENCES queues(id)
    );

    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      scope TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS permissions (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      description TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id TEXT NOT NULL,
      permission_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (role_id, permission_id),
      FOREIGN KEY (role_id) REFERENCES roles(id),
      FOREIGN KEY (permission_id) REFERENCES permissions(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      role_id TEXT,
      organization_id TEXT,
      department_id TEXT,
      full_name TEXT NOT NULL,
      mobile TEXT,
      email TEXT,
      actor_type TEXT NOT NULL DEFAULT 'citizen',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (role_id) REFERENCES roles(id),
      FOREIGN KEY (organization_id) REFERENCES organizations(id),
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS organization_members (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      member_type TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE (organization_id, user_id),
      FOREIGN KEY (organization_id) REFERENCES organizations(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS admin_roles (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      scope TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admin_permissions (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      description TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admin_role_permissions (
      role_id TEXT NOT NULL,
      permission_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (role_id, permission_id),
      FOREIGN KEY (role_id) REFERENCES admin_roles(id),
      FOREIGN KEY (permission_id) REFERENCES admin_permissions(id)
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      employee_id TEXT UNIQUE NOT NULL,
      official_email TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      role_id TEXT NOT NULL,
      organization_id TEXT,
      department_id TEXT,
      password_hash TEXT NOT NULL,
      mfa_enabled INTEGER DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'active',
      last_login_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (role_id) REFERENCES admin_roles(id),
      FOREIGN KEY (organization_id) REFERENCES organizations(id),
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS admin_department_mapping (
      id TEXT PRIMARY KEY,
      admin_user_id TEXT NOT NULL,
      organization_id TEXT NOT NULL,
      department_id TEXT NOT NULL,
      is_primary INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
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
      created_at TEXT DEFAULT (datetime('now')),
      rotated_from_session_id TEXT,
      FOREIGN KEY (admin_user_id) REFERENCES admin_users(id)
    );

    CREATE TABLE IF NOT EXISTS admin_login_logs (
      id TEXT PRIMARY KEY,
      admin_user_id TEXT,
      attempted_identifier TEXT NOT NULL,
      status TEXT NOT NULL,
      reason TEXT,
      ip_address TEXT,
      user_agent TEXT,
      device_fingerprint TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (admin_user_id) REFERENCES admin_users(id)
    );

    CREATE TABLE IF NOT EXISTS mfa_tokens (
      id TEXT PRIMARY KEY,
      admin_user_id TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      consumed_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      ip_address TEXT,
      device_fingerprint TEXT,
      FOREIGN KEY (admin_user_id) REFERENCES admin_users(id)
    );

    CREATE TABLE IF NOT EXISTS workflow_history (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      previous_state TEXT,
      next_state TEXT NOT NULL,
      actor_type TEXT NOT NULL,
      actor_id TEXT,
      comments TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS application_assignments (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      department_id TEXT NOT NULL,
      assigned_to_admin_user_id TEXT,
      queue_id TEXT,
      priority TEXT DEFAULT 'normal',
      assigned_by_admin_user_id TEXT,
      assigned_at TEXT DEFAULT (datetime('now')),
      status TEXT DEFAULT 'active',
      FOREIGN KEY (department_id) REFERENCES departments(id),
      FOREIGN KEY (assigned_to_admin_user_id) REFERENCES admin_users(id),
      FOREIGN KEY (queue_id) REFERENCES queues(id),
      FOREIGN KEY (assigned_by_admin_user_id) REFERENCES admin_users(id)
    );

    CREATE TABLE IF NOT EXISTS application_documents (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      owner_department_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      storage_key TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      sha256_hash TEXT,
      malware_status TEXT DEFAULT 'pending',
      verification_status TEXT DEFAULT 'pending',
      created_by_admin_user_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (owner_department_id) REFERENCES departments(id),
      FOREIGN KEY (created_by_admin_user_id) REFERENCES admin_users(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_type TEXT NOT NULL,
      actor_id TEXT,
      event_type TEXT NOT NULL,
      resource_type TEXT,
      resource_id TEXT,
      action TEXT NOT NULL,
      metadata_json TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS security_incidents (
      id TEXT PRIMARY KEY,
      incident_type TEXT NOT NULL,
      severity TEXT NOT NULL,
      actor_id TEXT,
      ip_address TEXT,
      details_json TEXT,
      status TEXT DEFAULT 'open',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS kiosks (
      id TEXT PRIMARY KEY,
      kiosk_code TEXT UNIQUE NOT NULL,
      location_name TEXT NOT NULL,
      district TEXT,
      state TEXT,
      organization_id TEXT,
      department_id TEXT,
      status TEXT DEFAULT 'online',
      last_heartbeat_at TEXT,
      software_version TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (organization_id) REFERENCES organizations(id),
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS kiosk_health_logs (
      id TEXT PRIMARY KEY,
      kiosk_id TEXT NOT NULL,
      cpu_usage REAL,
      ram_usage REAL,
      storage_usage REAL,
      network_status TEXT,
      printer_status TEXT,
      camera_status TEXT,
      microphone_status TEXT,
      biometric_status TEXT,
      suspicious_activity INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (kiosk_id) REFERENCES kiosks(id)
    );

    CREATE TABLE IF NOT EXISTS maintenance_logs (
      id TEXT PRIMARY KEY,
      kiosk_id TEXT NOT NULL,
      action_type TEXT NOT NULL,
      action_details TEXT,
      performed_by_admin_user_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (kiosk_id) REFERENCES kiosks(id),
      FOREIGN KEY (performed_by_admin_user_id) REFERENCES admin_users(id)
    );

    CREATE TABLE IF NOT EXISTS kiosk_sync_logs (
      id TEXT PRIMARY KEY,
      kiosk_id TEXT NOT NULL,
      sync_status TEXT NOT NULL,
      batch_reference TEXT,
      failure_reason TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (kiosk_id) REFERENCES kiosks(id)
    );

    CREATE TABLE IF NOT EXISTS sla_tracking (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      service_type TEXT NOT NULL,
      sla_hours INTEGER NOT NULL,
      started_at TEXT NOT NULL,
      due_at TEXT NOT NULL,
      breached_at TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS escalation_logs (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      level INTEGER NOT NULL,
      escalated_to_role TEXT NOT NULL,
      reason TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role_id);
    CREATE INDEX IF NOT EXISTS idx_admin_users_org ON admin_users(organization_id);
    CREATE INDEX IF NOT EXISTS idx_admin_users_department ON admin_users(department_id);
    CREATE INDEX IF NOT EXISTS idx_service_mapping_department ON service_department_mapping(department_id);
    CREATE INDEX IF NOT EXISTS idx_application_assignments_app ON application_assignments(application_id);
    CREATE INDEX IF NOT EXISTS idx_application_documents_app ON application_documents(application_id);
    CREATE INDEX IF NOT EXISTS idx_workflow_history_app ON workflow_history(application_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_type, actor_id);
    CREATE INDEX IF NOT EXISTS idx_login_logs_identifier ON admin_login_logs(attempted_identifier, created_at);
    CREATE INDEX IF NOT EXISTS idx_kiosk_health_kiosk ON kiosk_health_logs(kiosk_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_kiosk_sync_kiosk ON kiosk_sync_logs(kiosk_id, created_at);
  `);

  ensureLegacyColumns(db);
}

function ensureLegacyColumns(db) {
  const columns = db.prepare('PRAGMA table_info(service_requests)').all().map((c) => c.name);
  const maybeAdd = (name, sqlType) => {
    if (columns.includes(name)) return;
    db.exec(`ALTER TABLE service_requests ADD COLUMN ${name} ${sqlType}`);
  };

  maybeAdd('assigned_department_id', 'TEXT');
  maybeAdd('assigned_organization_id', 'TEXT');
  maybeAdd('assigned_queue_id', 'TEXT');
  maybeAdd('assigned_officer_admin_user_id', 'TEXT');
  maybeAdd('workflow_state', "TEXT DEFAULT 'Submitted'");
  maybeAdd('priority', "TEXT DEFAULT 'normal'");
}

export function seedEnterpriseData(db) {
  const roles = [
    { id: 'role_super_admin', code: 'SUPER_ADMIN', name: 'Super Admin', scope: 'global' },
    { id: 'role_kiosk_admin', code: 'KIOSK_ADMIN', name: 'Kiosk Admin', scope: 'kiosk' },
    { id: 'role_org_admin', code: 'ORGANIZATION_ADMIN', name: 'Organization Admin', scope: 'organization' },
    { id: 'role_department_head', code: 'DEPARTMENT_HEAD', name: 'Department Head', scope: 'department' },
    { id: 'role_department_officer', code: 'DEPARTMENT_OFFICER', name: 'Department Officer', scope: 'department' },
    { id: 'role_field_officer', code: 'FIELD_OFFICER', name: 'Field Officer', scope: 'department' },
    { id: 'role_auditor', code: 'AUDITOR', name: 'Auditor', scope: 'audit' },
    { id: 'role_security_analyst', code: 'SECURITY_ANALYST', name: 'Security Analyst', scope: 'security' },
    { id: 'role_support_staff', code: 'SUPPORT_STAFF', name: 'Support Staff', scope: 'support' },
  ];

  const organizations = [
    { id: 'org_municipal', code: 'MUNI', name: 'Municipal Corporation Portal', type: 'municipal' },
    { id: 'org_water', code: 'WATER', name: 'Water Department Portal', type: 'utility' },
    { id: 'org_electricity', code: 'ELEC', name: 'Electricity Board Portal', type: 'utility' },
    { id: 'org_health', code: 'HEALTH', name: 'Healthcare Portal', type: 'healthcare' },
    { id: 'org_transport', code: 'TRANSPORT', name: 'Transport Department Portal', type: 'transport' },
    { id: 'org_revenue', code: 'REVENUE', name: 'Revenue Department Portal', type: 'revenue' },
  ];

  const departments = [
    { id: 'dept_water_ops', organization_id: 'org_water', code: 'WATER_OPS', name: 'Water Operations', category: 'water' },
    { id: 'dept_elec_ops', organization_id: 'org_electricity', code: 'ELEC_OPS', name: 'Electricity Operations', category: 'electricity' },
    { id: 'dept_health_services', organization_id: 'org_health', code: 'HEALTH_SERV', name: 'Health Services', category: 'healthcare' },
    { id: 'dept_muni_revenue', organization_id: 'org_municipal', code: 'MUNI_REV', name: 'Municipal Revenue', category: 'municipal' },
    { id: 'dept_transport_ops', organization_id: 'org_transport', code: 'TRANSPORT_OPS', name: 'Transport Operations', category: 'transport' },
    { id: 'dept_revenue_ops', organization_id: 'org_revenue', code: 'REVENUE_OPS', name: 'Revenue Operations', category: 'revenue' },
    { id: 'dept_kiosk_ops', organization_id: 'org_municipal', code: 'KIOSK_OPS', name: 'Kiosk Operations', category: 'kiosk' },
    { id: 'dept_soc', organization_id: 'org_municipal', code: 'SOC', name: 'Security Operations Center', category: 'security' },
  ];

  const queues = [
    { id: 'queue_water_field', department_id: 'dept_water_ops', code: 'FIELD_TEAM', name: 'Field Team', priority_order: 1 },
    { id: 'queue_elec_field', department_id: 'dept_elec_ops', code: 'FIELD_TEAM', name: 'Field Team', priority_order: 1 },
    { id: 'queue_health_review', department_id: 'dept_health_services', code: 'REVIEW', name: 'Review Queue', priority_order: 1 },
    { id: 'queue_muni_review', department_id: 'dept_muni_revenue', code: 'REVIEW', name: 'Municipal Review', priority_order: 1 },
    { id: 'queue_transport_ops', department_id: 'dept_transport_ops', code: 'OPS', name: 'Transport Ops Queue', priority_order: 1 },
    { id: 'queue_revenue_ops', department_id: 'dept_revenue_ops', code: 'OPS', name: 'Revenue Ops Queue', priority_order: 1 },
  ];

  const serviceMap = [
    { id: 'map_water', service_type: 'water', organization_id: 'org_water', department_id: 'dept_water_ops', queue_id: 'queue_water_field', sla_hours: 24 },
    { id: 'map_water_leakage', service_type: 'water_leakage', organization_id: 'org_water', department_id: 'dept_water_ops', queue_id: 'queue_water_field', sla_hours: 24 },
    { id: 'map_electricity', service_type: 'electricity', organization_id: 'org_electricity', department_id: 'dept_elec_ops', queue_id: 'queue_elec_field', sla_hours: 48 },
    { id: 'map_healthcare', service_type: 'healthcare', organization_id: 'org_health', department_id: 'dept_health_services', queue_id: 'queue_health_review', sla_hours: 72 },
    { id: 'map_municipal', service_type: 'municipal', organization_id: 'org_municipal', department_id: 'dept_muni_revenue', queue_id: 'queue_muni_review', sla_hours: 96 },
    { id: 'map_sanitation', service_type: 'sanitation', organization_id: 'org_municipal', department_id: 'dept_muni_revenue', queue_id: 'queue_muni_review', sla_hours: 48 },
    { id: 'map_transport', service_type: 'transport', organization_id: 'org_transport', department_id: 'dept_transport_ops', queue_id: 'queue_transport_ops', sla_hours: 72 },
    { id: 'map_property_tax', service_type: 'property_tax', organization_id: 'org_revenue', department_id: 'dept_revenue_ops', queue_id: 'queue_revenue_ops', sla_hours: 168 },
    { id: 'map_revenue', service_type: 'revenue', organization_id: 'org_revenue', department_id: 'dept_revenue_ops', queue_id: 'queue_revenue_ops', sla_hours: 120 },
  ];

  const permissions = [
    ['perm_kiosk_monitor', 'kiosk.monitor'],
    ['perm_kiosk_control', 'kiosk.control'],
    ['perm_department_dashboard_view', 'department.dashboard.view'],
    ['perm_application_view_department', 'application.view.department'],
    ['perm_application_assign', 'application.assign'],
    ['perm_application_workflow_update', 'application.workflow.update'],
    ['perm_application_approve', 'application.approve'],
    ['perm_document_view', 'document.view'],
    ['perm_document_download', 'document.download'],
    ['perm_security_incident_view', 'security.incident.view'],
    ['perm_security_incident_manage', 'security.incident.manage'],
    ['perm_audit_view', 'audit.view'],
    ['perm_system_analytics_view', 'analytics.system.view'],
    ['perm_department_analytics_view', 'analytics.department.view'],
  ];

  const rolePermissions = {
    role_super_admin: permissions.map(([id]) => id),
    role_kiosk_admin: ['perm_kiosk_monitor', 'perm_kiosk_control', 'perm_system_analytics_view'],
    role_org_admin: [
      'perm_department_dashboard_view',
      'perm_application_view_department',
      'perm_application_assign',
      'perm_application_workflow_update',
      'perm_application_approve',
      'perm_document_view',
      'perm_document_download',
      'perm_department_analytics_view',
    ],
    role_department_head: [
      'perm_department_dashboard_view',
      'perm_application_view_department',
      'perm_application_assign',
      'perm_application_workflow_update',
      'perm_application_approve',
      'perm_document_view',
      'perm_document_download',
      'perm_department_analytics_view',
    ],
    role_department_officer: [
      'perm_department_dashboard_view',
      'perm_application_view_department',
      'perm_application_workflow_update',
      'perm_document_view',
    ],
    role_field_officer: ['perm_application_view_department', 'perm_application_workflow_update'],
    role_auditor: ['perm_audit_view'],
    role_security_analyst: ['perm_security_incident_view', 'perm_security_incident_manage', 'perm_audit_view'],
    role_support_staff: ['perm_kiosk_monitor'],
  };

  const nowPasswordHash = bcrypt.hashSync('Admin@2026!', 10);
  const shouldResetSeededPasswords = process.env.NODE_ENV !== 'production';
  const adminUsers = [
    {
      id: 'admin_super_001',
      employee_id: 'EMP-SUPER-001',
      official_email: 'superadmin@suvidha.gov.in',
      full_name: 'National Super Admin',
      role_id: 'role_super_admin',
      organization_id: 'org_municipal',
      department_id: 'dept_kiosk_ops',
    },
    {
      id: 'admin_kiosk_001',
      employee_id: 'EMP-KIOSK-001',
      official_email: 'kiosk.admin@suvidha.gov.in',
      full_name: 'Kiosk Operations Admin',
      role_id: 'role_kiosk_admin',
      organization_id: 'org_municipal',
      department_id: 'dept_kiosk_ops',
    },
    {
      id: 'admin_org_elec_001',
      employee_id: 'EMP-ELEC-ORG-001',
      official_email: 'electricity.admin@suvidha.gov.in',
      full_name: 'Electricity Organization Admin',
      role_id: 'role_org_admin',
      organization_id: 'org_electricity',
      department_id: 'dept_elec_ops',
    },
    {
      id: 'admin_org_water_001',
      employee_id: 'EMP-WATER-ORG-001',
      official_email: 'water.admin@suvidha.gov.in',
      full_name: 'Water Organization Admin',
      role_id: 'role_org_admin',
      organization_id: 'org_water',
      department_id: 'dept_water_ops',
    },
    {
      id: 'admin_org_health_001',
      employee_id: 'EMP-HEALTH-ORG-001',
      official_email: 'health.admin@suvidha.gov.in',
      full_name: 'Healthcare Organization Admin',
      role_id: 'role_org_admin',
      organization_id: 'org_health',
      department_id: 'dept_health_services',
    },
    {
      id: 'admin_org_muni_001',
      employee_id: 'EMP-MUNI-ORG-001',
      official_email: 'municipal.admin@suvidha.gov.in',
      full_name: 'Municipal Organization Admin',
      role_id: 'role_org_admin',
      organization_id: 'org_municipal',
      department_id: 'dept_muni_revenue',
    },
    {
      id: 'admin_org_transport_001',
      employee_id: 'EMP-TRN-ORG-001',
      official_email: 'transport.admin@suvidha.gov.in',
      full_name: 'Transport Organization Admin',
      role_id: 'role_org_admin',
      organization_id: 'org_transport',
      department_id: 'dept_transport_ops',
    },
    {
      id: 'admin_org_revenue_001',
      employee_id: 'EMP-REV-ORG-001',
      official_email: 'revenue.admin@suvidha.gov.in',
      full_name: 'Revenue Organization Admin',
      role_id: 'role_org_admin',
      organization_id: 'org_revenue',
      department_id: 'dept_revenue_ops',
    },
    {
      id: 'admin_security_001',
      employee_id: 'EMP-SOC-001',
      official_email: 'soc.analyst@suvidha.gov.in',
      full_name: 'SOC Analyst',
      role_id: 'role_security_analyst',
      organization_id: 'org_municipal',
      department_id: 'dept_soc',
    },
  ];

  const kiosks = [
    { id: 'kiosk_chennai_001', kiosk_code: 'KIOSK-CHN-001', location_name: 'Chennai Central Helpdesk', district: 'Chennai', state: 'Tamil Nadu' },
    { id: 'kiosk_chennai_002', kiosk_code: 'KIOSK-CHN-002', location_name: 'T. Nagar Service Center', district: 'Chennai', state: 'Tamil Nadu' },
    { id: 'kiosk_delhi_001', kiosk_code: 'KIOSK-DLH-001', location_name: 'Connaught Place Civic Kiosk', district: 'New Delhi', state: 'Delhi' },
  ];

  const tx = db.transaction(() => {
    const insertRole = db.prepare('INSERT OR IGNORE INTO admin_roles (id, code, name, scope) VALUES (?, ?, ?, ?)');
    for (const role of roles) {
      insertRole.run(role.id, role.code, role.name, role.scope);
    }

    const insertOrg = db.prepare('INSERT OR IGNORE INTO organizations (id, code, name, type) VALUES (?, ?, ?, ?)');
    for (const org of organizations) {
      insertOrg.run(org.id, org.code, org.name, org.type);
    }

    const insertDept = db.prepare('INSERT OR IGNORE INTO departments (id, organization_id, code, name, category) VALUES (?, ?, ?, ?, ?)');
    for (const dept of departments) {
      insertDept.run(dept.id, dept.organization_id, dept.code, dept.name, dept.category);
    }

    const insertQueue = db.prepare('INSERT OR IGNORE INTO queues (id, department_id, code, name, priority_order) VALUES (?, ?, ?, ?, ?)');
    for (const q of queues) {
      insertQueue.run(q.id, q.department_id, q.code, q.name, q.priority_order);
    }

    const hasOrganization = db.prepare('SELECT 1 FROM organizations WHERE id = ? LIMIT 1');
    const hasDepartment = db.prepare('SELECT 1 FROM departments WHERE id = ? LIMIT 1');
    const findQueueById = db.prepare('SELECT id FROM queues WHERE id = ? LIMIT 1');
    const fallbackQueueForDept = db.prepare(`
      SELECT id
      FROM queues
      WHERE department_id = ?
      ORDER BY priority_order ASC, created_at ASC
      LIMIT 1
    `);

    const insertMapping = db.prepare(`
      INSERT OR IGNORE INTO service_department_mapping
      (id, service_type, organization_id, department_id, queue_id, sla_hours, active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `);
    for (const mapping of serviceMap) {
      if (!hasOrganization.get(mapping.organization_id) || !hasDepartment.get(mapping.department_id)) {
        continue;
      }
      let resolvedQueueId = mapping.queue_id || null;
      if (resolvedQueueId && !findQueueById.get(resolvedQueueId)) {
        resolvedQueueId = fallbackQueueForDept.get(mapping.department_id)?.id || null;
      }
      insertMapping.run(
        mapping.id,
        mapping.service_type,
        mapping.organization_id,
        mapping.department_id,
        resolvedQueueId,
        mapping.sla_hours,
        new Date().toISOString(),
      );
    }

    const insertPermission = db.prepare('INSERT OR IGNORE INTO admin_permissions (id, code, description) VALUES (?, ?, ?)');
    for (const [id, code] of permissions) {
      insertPermission.run(id, code, `Permission for ${code}`);
    }

    const insertRolePermission = db.prepare('INSERT OR IGNORE INTO admin_role_permissions (role_id, permission_id) VALUES (?, ?)');
    for (const [roleId, permissionIds] of Object.entries(rolePermissions)) {
      for (const permissionId of permissionIds) {
        insertRolePermission.run(roleId, permissionId);
      }
    }

    const insertAdminUser = db.prepare(`
      INSERT OR IGNORE INTO admin_users
      (id, employee_id, official_email, full_name, role_id, organization_id, department_id, password_hash, mfa_enabled, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'active')
    `);
    const updateAdminPassword = db.prepare(`
      UPDATE admin_users
      SET password_hash = ?, updated_at = datetime('now')
      WHERE employee_id = ? AND status = 'active'
    `);
    const insertDeptMap = db.prepare(`
      INSERT OR IGNORE INTO admin_department_mapping (id, admin_user_id, organization_id, department_id, is_primary)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const user of adminUsers) {
      insertAdminUser.run(
        user.id,
        user.employee_id,
        user.official_email,
        user.full_name,
        user.role_id,
        user.organization_id,
        user.department_id,
        nowPasswordHash,
      );
      insertDeptMap.run(`map_${user.id}_${user.department_id}`, user.id, user.organization_id, user.department_id, 1);
    }

    if (shouldResetSeededPasswords) {
      for (const user of adminUsers) {
        updateAdminPassword.run(nowPasswordHash, user.employee_id);
      }
    }

    const insertKiosk = db.prepare(`
      INSERT OR IGNORE INTO kiosks
      (id, kiosk_code, location_name, district, state, organization_id, department_id, status, software_version, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'org_municipal', 'dept_kiosk_ops', 'online', '2.0.0', ?, ?)
    `);
    for (const kiosk of kiosks) {
      insertKiosk.run(
        kiosk.id,
        kiosk.kiosk_code,
        kiosk.location_name,
        kiosk.district,
        kiosk.state,
        new Date().toISOString(),
        new Date().toISOString(),
      );
    }
  });

  tx();
}
