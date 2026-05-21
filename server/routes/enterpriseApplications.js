import { Router } from 'express';
import { randomUUID } from 'crypto';
import { verifyJWT, requirePermission, requireDepartmentOwnership, auditLogger } from '../middleware/authMiddleware.js';
import { ADMIN_PERMISSIONS, WORKFLOW_STATES } from '../config/enterpriseRbac.js';
import { createSlaDeadline, resolveDepartmentRoute } from '../services/routingEngine.js';
import { writeAuditLog } from '../services/auditService.js';

const router = Router();

function createWorkflowEntry(db, { applicationId, fromState, toState, actorAdminId, comment }) {
  db.prepare(`
    INSERT INTO workflow_history
    (id, application_id, from_state, to_state, actor_admin_id, comment, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(randomUUID(), applicationId, fromState || null, toState, actorAdminId, comment || null);
}

router.post(
  '/applications',
  verifyJWT,
  auditLogger('APPLICATION_CREATE', 'application'),
  (req, res) => {
    const db = req.app.locals.db;
    const { citizenName, citizenMobile, citizenUid, serviceType, title, description, priority } = req.body || {};

    if (!citizenName || !citizenMobile || !serviceType || !title) {
      return res.status(400).json({
        success: false,
        error: 'citizenName, citizenMobile, serviceType and title are required.',
      });
    }

    let route;
    try {
      route = resolveDepartmentRoute(db, serviceType);
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    const applicationId = randomUUID();
    db.prepare(`
      INSERT INTO applications_enterprise
      (id, citizen_uid, citizen_name, citizen_mobile, service_type, title, description, organization_id, department_id, queue_id, status, priority, submitted_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(
      applicationId,
      citizenUid || null,
      citizenName,
      citizenMobile,
      serviceType,
      title,
      description || null,
      route.organizationId,
      route.departmentId,
      route.queueId || null,
      WORKFLOW_STATES.SUBMITTED,
      priority || 'normal'
    );

    db.prepare(`
      INSERT INTO sla_tracking
      (id, application_id, deadline_at, breached, reminder_sent_count, created_at, updated_at)
      VALUES (?, ?, ?, 0, 0, datetime('now'), datetime('now'))
    `).run(randomUUID(), applicationId, createSlaDeadline(route.slaHours));

    createWorkflowEntry(db, {
      applicationId,
      fromState: null,
      toState: WORKFLOW_STATES.SUBMITTED,
      actorAdminId: req.user?.sub || 'system',
      comment: 'Application submitted and auto-routed by routing engine.',
    });

    return res.status(201).json({
      success: true,
      data: {
        applicationId,
        status: WORKFLOW_STATES.SUBMITTED,
        routing: {
          serviceType,
          organizationId: route.organizationId,
          organizationName: route.organizationName,
          departmentId: route.departmentId,
          departmentName: route.departmentName,
          queueId: route.queueId,
          queueCode: route.queueCode,
          source: route.source,
        },
      },
    });
  }
);

router.get(
  '/applications',
  verifyJWT,
  requirePermission(ADMIN_PERMISSIONS.APPLICATION_READ_DEPARTMENT),
  (req, res) => {
    const db = req.app.locals.db;
    const status = req.query.status;
    const departmentId = req.user.role === 'super_admin' ? req.query.departmentId : req.user.departmentId;
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const offset = (page - 1) * limit;

    let sql = `
      SELECT id, citizen_name AS citizenName, citizen_mobile AS citizenMobile, service_type AS serviceType, title, status, priority, submitted_at AS submittedAt, updated_at AS updatedAt
      FROM applications_enterprise
      WHERE deleted_at IS NULL
    `;
    const params = [];
    if (departmentId) {
      sql += ' AND department_id = ?';
      params.push(departmentId);
    }
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    sql += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows = db.prepare(sql).all(...params);
    return res.json({ success: true, data: rows, pagination: { page, limit } });
  }
);

router.post(
  '/applications/:applicationId/assign',
  verifyJWT,
  requirePermission(ADMIN_PERMISSIONS.OFFICER_ASSIGN),
  auditLogger('APPLICATION_ASSIGN', 'application'),
  (req, res) => {
    const db = req.app.locals.db;
    const { applicationId } = req.params;
    const { assignedToAdminId, note } = req.body || {};

    const application = db.prepare(`
      SELECT id, status, department_id AS departmentId
      FROM applications_enterprise
      WHERE id = ?
    `).get(applicationId);
    if (!application) return res.status(404).json({ success: false, error: 'Application not found.' });

    if (req.user.role !== 'super_admin' && application.departmentId !== req.user.departmentId) {
      return res.status(403).json({ success: false, error: 'Cross-department assignment blocked.' });
    }

    const targetOfficer = db.prepare(`
      SELECT id, department_id AS departmentId
      FROM admin_users
      WHERE id = ? AND status = 'active'
    `).get(assignedToAdminId);
    if (!targetOfficer) return res.status(404).json({ success: false, error: 'Assigned officer not found.' });
    if (targetOfficer.departmentId !== application.departmentId) {
      return res.status(400).json({ success: false, error: 'Officer must belong to the same department.' });
    }

    db.prepare(`
      INSERT INTO application_assignments
      (id, application_id, assigned_by_admin_id, assigned_to_admin_id, assigned_department_id, assignment_note, assigned_at, active)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), 1)
    `).run(randomUUID(), applicationId, req.user.sub, assignedToAdminId, application.departmentId, note || null);

    db.prepare(`
      UPDATE applications_enterprise
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(WORKFLOW_STATES.ASSIGNED, applicationId);

    createWorkflowEntry(db, {
      applicationId,
      fromState: application.status,
      toState: WORKFLOW_STATES.ASSIGNED,
      actorAdminId: req.user.sub,
      comment: note || 'Application assigned to officer.',
    });

    return res.json({ success: true, message: 'Application assigned successfully.' });
  }
);

router.post(
  '/applications/:applicationId/workflow',
  verifyJWT,
  requirePermission(ADMIN_PERMISSIONS.APPLICATION_WORKFLOW_ACTION),
  auditLogger('WORKFLOW_STATE_CHANGE', 'application'),
  (req, res) => {
    const db = req.app.locals.db;
    const { applicationId } = req.params;
    const { toState, comment } = req.body || {};
    const allowedStates = new Set(Object.values(WORKFLOW_STATES));
    if (!allowedStates.has(toState)) {
      return res.status(400).json({ success: false, error: 'Invalid workflow state.' });
    }

    const appRow = db.prepare(`
      SELECT id, status, department_id AS departmentId
      FROM applications_enterprise
      WHERE id = ?
    `).get(applicationId);
    if (!appRow) return res.status(404).json({ success: false, error: 'Application not found.' });
    if (req.user.role !== 'super_admin' && appRow.departmentId !== req.user.departmentId) {
      return res.status(403).json({ success: false, error: 'Cross-department workflow action blocked.' });
    }

    db.prepare(`
      UPDATE applications_enterprise
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(toState, applicationId);

    createWorkflowEntry(db, {
      applicationId,
      fromState: appRow.status,
      toState,
      actorAdminId: req.user.sub,
      comment: comment || null,
    });

    if (toState === WORKFLOW_STATES.ESCALATED) {
      db.prepare(`
        INSERT INTO escalation_logs
        (id, application_id, escalation_level, reason, escalated_to_admin_id, created_at)
        VALUES (?, ?, 1, ?, NULL, datetime('now'))
      `).run(randomUUID(), applicationId, comment || 'Escalated manually');
    }

    writeAuditLog(db, {
      actorType: 'admin',
      actorId: req.user.sub,
      action: 'WORKFLOW_STATE_CHANGE',
      entityType: 'application',
      entityId: applicationId,
      departmentId: appRow.departmentId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { fromState: appRow.status, toState },
    });

    return res.json({ success: true, message: 'Workflow updated.', data: { fromState: appRow.status, toState } });
  }
);

router.get(
  '/departments/:departmentId/dashboard',
  verifyJWT,
  requirePermission(ADMIN_PERMISSIONS.APPLICATION_READ_DEPARTMENT),
  requireDepartmentOwnership({ source: 'params', field: 'departmentId' }),
  (req, res) => {
    const db = req.app.locals.db;
    const { departmentId } = req.params;

    const total = db.prepare('SELECT COUNT(*) as c FROM applications_enterprise WHERE department_id = ?').get(departmentId).c;
    const pending = db.prepare(`
      SELECT COUNT(*) as c
      FROM applications_enterprise
      WHERE department_id = ? AND status IN (?, ?, ?, ?)
    `).get(
      departmentId,
      WORKFLOW_STATES.SUBMITTED,
      WORKFLOW_STATES.ASSIGNED,
      WORKFLOW_STATES.UNDER_REVIEW,
      WORKFLOW_STATES.VERIFICATION_PENDING
    ).c;
    const approved = db.prepare(`
      SELECT COUNT(*) as c FROM applications_enterprise WHERE department_id = ? AND status = ?
    `).get(departmentId, WORKFLOW_STATES.APPROVED).c;

    return res.json({
      success: true,
      data: { departmentId, total, pending, approved },
    });
  }
);

export default router;

