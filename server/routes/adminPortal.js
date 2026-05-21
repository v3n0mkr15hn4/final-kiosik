import { Router } from 'express';
import crypto from 'crypto';
import { WORKFLOW_STATES } from '../enterprise/config/constants.js';
import { routeApplication } from '../enterprise/services/routingService.js';
import { requireDepartmentOwnership, requirePermission } from '../middleware/enterprise/authz.js';
import { auditLogger } from '../middleware/enterprise/auditLogger.js';

const router = Router();

function resolveRequestDepartment(req) {
  const db = req.app.locals.db;
  const applicationId = req.params.applicationId || req.params.id;
  const row = db.prepare('SELECT assigned_department_id FROM service_requests WHERE request_id = ?').get(applicationId);
  return row?.assigned_department_id || null;
}

router.get('/dashboard/summary', requirePermission('department.dashboard.view'), (req, res) => {
  const db = req.app.locals.db;
  const isSuper = req.auth.roleCode === 'SUPER_ADMIN';
  const where = isSuper ? '' : 'WHERE assigned_department_id = ?';
  const params = isSuper ? [] : [req.auth.departmentId];

  const total = db.prepare(`SELECT COUNT(*) AS c FROM service_requests ${where}`).get(...params).c;
  const submitted = db.prepare(`SELECT COUNT(*) AS c FROM service_requests ${where}${where ? ' AND' : ' WHERE'} workflow_state = ?`).get(...params, WORKFLOW_STATES.SUBMITTED).c;
  const assigned = db.prepare(`SELECT COUNT(*) AS c FROM service_requests ${where}${where ? ' AND' : ' WHERE'} workflow_state = ?`).get(...params, WORKFLOW_STATES.ASSIGNED).c;
  const approved = db.prepare(`SELECT COUNT(*) AS c FROM service_requests ${where}${where ? ' AND' : ' WHERE'} workflow_state = ?`).get(...params, WORKFLOW_STATES.APPROVED).c;
  const rejected = db.prepare(`SELECT COUNT(*) AS c FROM service_requests ${where}${where ? ' AND' : ' WHERE'} workflow_state = ?`).get(...params, WORKFLOW_STATES.REJECTED).c;

  return res.json({
    success: true,
    summary: { total, submitted, assigned, approved, rejected },
    scope: isSuper ? 'global' : 'department',
    departmentId: isSuper ? null : req.auth.departmentId,
  });
});

router.get('/applications', requirePermission('application.view.department'), (req, res) => {
  const db = req.app.locals.db;
  const { page = 1, limit = 20, status } = req.query;
  const isSuper = req.auth.roleCode === 'SUPER_ADMIN';

  let sql = 'SELECT * FROM service_requests WHERE 1=1';
  const params = [];

  if (!isSuper) {
    sql += ' AND assigned_department_id = ?';
    params.push(req.auth.departmentId);
  }

  if (status) {
    sql += ' AND workflow_state = ?';
    params.push(status);
  }

  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) AS c');
  const total = db.prepare(countSql).get(...params).c;

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), (Number(page) - 1) * Number(limit));

  const rows = db.prepare(sql).all(...params);
  return res.json({
    success: true,
    applications: rows,
    pagination: { page: Number(page), limit: Number(limit), total },
  });
});

router.post('/applications/:applicationId/route', requirePermission('application.assign'), auditLogger('workflow', 'application_routed', 'application'), (req, res) => {
  const db = req.app.locals.db;
  const { applicationId } = req.params;
  const app = db.prepare('SELECT request_id, service_type FROM service_requests WHERE request_id = ?').get(applicationId);

  if (!app) {
    return res.status(404).json({ success: false, error: 'Application not found.' });
  }

  const route = routeApplication(db, {
    applicationId: app.request_id,
    serviceType: app.service_type,
  });

  return res.json({ success: true, route });
});

router.post(
  '/applications/:applicationId/assign',
  requirePermission('application.assign'),
  requireDepartmentOwnership(resolveRequestDepartment),
  auditLogger('workflow', 'application_assigned', 'application'),
  (req, res) => {
    const db = req.app.locals.db;
    const { applicationId } = req.params;
    const { officerAdminUserId, priority = 'normal' } = req.body || {};

    if (!officerAdminUserId) {
      return res.status(400).json({ success: false, error: 'officerAdminUserId is required.' });
    }

    const assignmentId = crypto.randomUUID();
    db.prepare(
      `INSERT INTO application_assignments
       (id, application_id, department_id, assigned_to_admin_user_id, priority, assigned_by_admin_user_id, assigned_at, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`
    ).run(
      assignmentId,
      applicationId,
      req.auth.departmentId,
      officerAdminUserId,
      priority,
      req.auth.sub,
      new Date().toISOString()
    );

    db.prepare(
      `INSERT INTO workflow_history
       (id, application_id, previous_state, next_state, actor_type, actor_id, comments, created_at)
       VALUES (?, ?, ?, ?, 'admin', ?, ?, ?)`
    ).run(
      crypto.randomUUID(),
      applicationId,
      WORKFLOW_STATES.SUBMITTED,
      WORKFLOW_STATES.ASSIGNED,
      req.auth.sub,
      `Assigned to officer ${officerAdminUserId}`,
      new Date().toISOString()
    );

    db.prepare('UPDATE service_requests SET workflow_state = ?, priority = ?, updated_at = ? WHERE request_id = ?').run(
      WORKFLOW_STATES.ASSIGNED,
      priority,
      new Date().toISOString(),
      applicationId
    );

    req.app.locals.io?.to(`department:${req.auth.departmentId}`).emit('application:assigned', {
      applicationId,
      officerAdminUserId,
      priority,
      assignedBy: req.auth.sub,
      timestamp: new Date().toISOString(),
    });

    return res.json({ success: true, assignmentId });
  }
);

router.post(
  '/applications/:applicationId/workflow',
  requirePermission('application.workflow.update'),
  requireDepartmentOwnership(resolveRequestDepartment),
  auditLogger('workflow', 'application_workflow_updated', 'application'),
  (req, res) => {
    const db = req.app.locals.db;
    const { applicationId } = req.params;
    const { nextState, comments } = req.body || {};

    if (!nextState || !Object.values(WORKFLOW_STATES).includes(nextState)) {
      return res.status(400).json({ success: false, error: 'Invalid workflow state.' });
    }

    const app = db.prepare('SELECT workflow_state FROM service_requests WHERE request_id = ?').get(applicationId);
    if (!app) {
      return res.status(404).json({ success: false, error: 'Application not found.' });
    }

    db.prepare('UPDATE service_requests SET workflow_state = ?, updated_at = ? WHERE request_id = ?').run(
      nextState,
      new Date().toISOString(),
      applicationId
    );

    db.prepare(
      `INSERT INTO workflow_history
       (id, application_id, previous_state, next_state, actor_type, actor_id, comments, created_at)
       VALUES (?, ?, ?, ?, 'admin', ?, ?, ?)`
    ).run(
      crypto.randomUUID(),
      applicationId,
      app.workflow_state || WORKFLOW_STATES.SUBMITTED,
      nextState,
      req.auth.sub,
      comments || null,
      new Date().toISOString()
    );

    req.app.locals.io?.to(`department:${req.auth.departmentId}`).emit('workflow:updated', {
      applicationId,
      previousState: app.workflow_state || WORKFLOW_STATES.SUBMITTED,
      nextState,
      actorId: req.auth.sub,
      timestamp: new Date().toISOString(),
    });

    return res.json({ success: true, applicationId, previousState: app.workflow_state, nextState });
  }
);

router.get('/kiosk/health', requirePermission('kiosk.monitor'), (req, res) => {
  const db = req.app.locals.db;
  const rows = db.prepare(`
    SELECT
      k.id,
      k.kiosk_code,
      k.location_name,
      k.status,
      k.last_heartbeat_at,
      k.software_version,
      h.cpu_usage,
      h.ram_usage,
      h.storage_usage,
      h.network_status,
      h.printer_status,
      h.camera_status,
      h.microphone_status,
      h.biometric_status,
      h.suspicious_activity,
      h.created_at
    FROM kiosks k
    LEFT JOIN kiosk_health_logs h ON h.id = (
      SELECT hh.id FROM kiosk_health_logs hh
      WHERE hh.kiosk_id = k.id
      ORDER BY hh.created_at DESC
      LIMIT 1
    )
    ORDER BY k.kiosk_code
  `).all();

  return res.json({ success: true, kiosks: rows });
});

router.post('/kiosk/:kioskId/heartbeat', requirePermission('kiosk.monitor'), auditLogger('kiosk', 'kiosk_heartbeat', 'kiosk'), (req, res) => {
  const db = req.app.locals.db;
  const { kioskId } = req.params;
  const {
    cpuUsage,
    ramUsage,
    storageUsage,
    networkStatus,
    printerStatus,
    cameraStatus,
    microphoneStatus,
    biometricStatus,
    suspiciousActivity = false,
  } = req.body || {};

  const kiosk = db.prepare('SELECT id FROM kiosks WHERE id = ?').get(kioskId);
  if (!kiosk) {
    return res.status(404).json({ success: false, error: 'Kiosk not found.' });
  }

  db.prepare('UPDATE kiosks SET last_heartbeat_at = ?, updated_at = ? WHERE id = ?').run(
    new Date().toISOString(),
    new Date().toISOString(),
    kioskId
  );

  db.prepare(`
    INSERT INTO kiosk_health_logs
    (id, kiosk_id, cpu_usage, ram_usage, storage_usage, network_status, printer_status, camera_status,
     microphone_status, biometric_status, suspicious_activity, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    crypto.randomUUID(),
    kioskId,
    cpuUsage ?? null,
    ramUsage ?? null,
    storageUsage ?? null,
    networkStatus || null,
    printerStatus || null,
    cameraStatus || null,
    microphoneStatus || null,
    biometricStatus || null,
    suspiciousActivity ? 1 : 0,
    new Date().toISOString()
  );

  req.app.locals.io?.to(`kiosk:${kioskId}`).emit('kiosk:heartbeat', {
    kioskId,
    cpuUsage,
    ramUsage,
    storageUsage,
    networkStatus,
    suspiciousActivity: Boolean(suspiciousActivity),
    timestamp: new Date().toISOString(),
  });

  return res.json({ success: true, message: 'Heartbeat recorded.' });
});

router.get('/security/incidents', requirePermission('security.incident.view'), (req, res) => {
  const db = req.app.locals.db;
  const rows = db.prepare('SELECT * FROM security_incidents ORDER BY created_at DESC LIMIT 200').all();
  return res.json({ success: true, incidents: rows });
});

router.get('/audit/logs', requirePermission('audit.view'), (req, res) => {
  const db = req.app.locals.db;
  const rows = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 500').all();
  return res.json({ success: true, logs: rows });
});

export default router;
