import { Router } from 'express';
import crypto from 'crypto';
import { WORKFLOW_STATES, ADMIN_ROLES } from '../enterprise/config/constants.js';
import { requirePermission } from '../middleware/enterprise/authz.js';
import { auditLogger } from '../middleware/enterprise/auditLogger.js';
import {
  requireDepartmentIsolation,
  requireOrganizationIsolation,
  requireOrganizationPortalRole,
  resolveApplicationScope,
} from '../middleware/enterprise/isolation.js';
import { routeApplication } from '../enterprise/services/routingService.js';

const router = Router();

router.use(requireOrganizationPortalRole);

function resolveOrganizationIdFromParams(req) {
  return req.params.organizationId;
}

function getApplicationScope(req) {
  const db = req.app.locals.db;
  return resolveApplicationScope(db, req.params.applicationId);
}

function ensureDepartmentWorkflowScope(req, res, next) {
  if ([ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.ORGANIZATION_ADMIN].includes(req.auth.roleCode)) {
    return next();
  }

  const scope = getApplicationScope(req);
  if (!scope) {
    return res.status(404).json({ success: false, error: 'Application not found.' });
  }

  if (!req.auth.departmentId || scope.departmentId !== req.auth.departmentId) {
    return res.status(403).json({
      success: false,
      error: 'Department isolation check failed. Cross-department workflow access is not allowed.',
    });
  }

  return next();
}

function validateWorkflowState(nextState) {
  return Object.values(WORKFLOW_STATES).includes(nextState);
}

router.get('/organizations', (req, res) => {
  const db = req.app.locals.db;

  if (req.auth.roleCode === ADMIN_ROLES.SUPER_ADMIN) {
    const organizations = db.prepare(`
      SELECT id, code, name, type, status
      FROM organizations
      ORDER BY name
    `).all();
    return res.json({ success: true, organizations });
  }

  if (!req.auth.organizationId) {
    return res.status(403).json({ success: false, error: 'No organization assigned to this account.' });
  }

  const row = db.prepare('SELECT id, code, name, type, status FROM organizations WHERE id = ?').get(req.auth.organizationId);
  return res.json({ success: true, organizations: row ? [row] : [] });
});

router.get(
  '/:organizationId/dashboard/summary',
  requireOrganizationIsolation(resolveOrganizationIdFromParams),
  requirePermission('department.dashboard.view'),
  (req, res) => {
    const db = req.app.locals.db;
    const whereByDept = req.auth.roleCode === ADMIN_ROLES.DEPARTMENT_HEAD
      || req.auth.roleCode === ADMIN_ROLES.DEPARTMENT_OFFICER
      || req.auth.roleCode === ADMIN_ROLES.FIELD_OFFICER;

    const where = whereByDept ? 'AND assigned_department_id = ?' : '';
    const params = whereByDept ? [req.auth.departmentId] : [];

    const total = db.prepare(`
      SELECT COUNT(*) AS c
      FROM service_requests
      WHERE assigned_organization_id = ? ${where}
    `).get(req.params.organizationId, ...params).c;

    const byState = db.prepare(`
      SELECT workflow_state AS state, COUNT(*) AS count
      FROM service_requests
      WHERE assigned_organization_id = ? ${where}
      GROUP BY workflow_state
      ORDER BY count DESC
    `).all(req.params.organizationId, ...params);

    const slaBreaches = db.prepare(`
      SELECT COUNT(*) AS c
      FROM sla_tracking st
      JOIN service_requests sr ON sr.request_id = st.application_id
      WHERE sr.assigned_organization_id = ?
        AND st.status = 'active'
        AND datetime(st.due_at) < datetime('now')
        ${whereByDept ? 'AND sr.assigned_department_id = ?' : ''}
    `).get(req.params.organizationId, ...params).c;

    return res.json({
      success: true,
      summary: {
        total,
        byState,
        slaBreaches,
      },
    });
  },
);

router.get(
  '/:organizationId/applications',
  requireOrganizationIsolation(resolveOrganizationIdFromParams),
  requirePermission('application.view.department'),
  (req, res) => {
    const db = req.app.locals.db;
    const { workflowState, departmentId, page = 1, limit = 20 } = req.query;
    const isDepartmentRole = [ADMIN_ROLES.DEPARTMENT_HEAD, ADMIN_ROLES.DEPARTMENT_OFFICER, ADMIN_ROLES.FIELD_OFFICER].includes(req.auth.roleCode);

    let sql = 'SELECT * FROM service_requests WHERE assigned_organization_id = ?';
    const params = [req.params.organizationId];

    if (isDepartmentRole) {
      sql += ' AND assigned_department_id = ?';
      params.push(req.auth.departmentId);
    } else if (departmentId) {
      sql += ' AND assigned_department_id = ?';
      params.push(departmentId);
    }

    if (workflowState) {
      sql += ' AND workflow_state = ?';
      params.push(workflowState);
    }

    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) AS c');
    const total = db.prepare(countSql).get(...params).c;

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), (Number(page) - 1) * Number(limit));

    const applications = db.prepare(sql).all(...params);
    return res.json({
      success: true,
      applications,
      pagination: { page: Number(page), limit: Number(limit), total },
    });
  },
);

router.get(
  '/:organizationId/applications/:applicationId',
  requireOrganizationIsolation(resolveOrganizationIdFromParams),
  requirePermission('application.view.department'),
  ensureDepartmentWorkflowScope,
  (req, res) => {
    const db = req.app.locals.db;
    const app = db.prepare('SELECT * FROM service_requests WHERE request_id = ?').get(req.params.applicationId);
    if (!app) {
      return res.status(404).json({ success: false, error: 'Application not found.' });
    }

    const assignments = db.prepare(`
      SELECT *
      FROM application_assignments
      WHERE application_id = ?
      ORDER BY assigned_at DESC
      LIMIT 50
    `).all(req.params.applicationId);

    const workflowHistory = db.prepare(`
      SELECT *
      FROM workflow_history
      WHERE application_id = ?
      ORDER BY created_at DESC
      LIMIT 100
    `).all(req.params.applicationId);

    return res.json({ success: true, application: app, assignments, workflowHistory });
  },
);

router.get(
  '/:organizationId/applications/:applicationId/documents',
  requireOrganizationIsolation(resolveOrganizationIdFromParams),
  requirePermission('document.view'),
  ensureDepartmentWorkflowScope,
  (req, res) => {
    const db = req.app.locals.db;
    const documents = db.prepare(`
      SELECT id, application_id, file_name, mime_type, file_size, verification_status, malware_status, created_at
      FROM application_documents
      WHERE application_id = ?
      ORDER BY created_at DESC
    `).all(req.params.applicationId);
    return res.json({ success: true, documents });
  },
);

router.post(
  '/:organizationId/applications/:applicationId/documents/import-session',
  requireOrganizationIsolation(resolveOrganizationIdFromParams),
  requirePermission('document.view'),
  ensureDepartmentWorkflowScope,
  auditLogger('document', 'application_documents_imported', 'application'),
  (req, res) => {
    const db = req.app.locals.db;
    const { sessionId } = req.body || {};
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'sessionId is required.' });
    }

    const app = db.prepare(`
      SELECT request_id, assigned_department_id
      FROM service_requests
      WHERE request_id = ?
    `).get(req.params.applicationId);

    if (!app) {
      return res.status(404).json({ success: false, error: 'Application not found.' });
    }

    const uploads = db.prepare(`
      SELECT filename, original_name, mime_type, size
      FROM uploads
      WHERE session_id = ?
      ORDER BY created_at ASC
    `).all(sessionId);

    if (uploads.length === 0) {
      return res.status(404).json({ success: false, error: 'No uploaded files found for this session.' });
    }

    const insertDoc = db.prepare(`
      INSERT INTO application_documents
      (id, application_id, owner_department_id, file_name, storage_key, mime_type, file_size, sha256_hash, malware_status, verification_status, created_by_admin_user_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', ?, ?)
    `);

    const now = new Date().toISOString();
    const importedIds = [];
    for (const file of uploads) {
      const docId = crypto.randomUUID();
      insertDoc.run(
        docId,
        req.params.applicationId,
        app.assigned_department_id,
        file.original_name,
        file.filename,
        file.mime_type || 'application/octet-stream',
        Number(file.size || 0),
        null,
        req.auth.sub,
        now,
      );
      importedIds.push(docId);
    }

    return res.json({ success: true, importedDocumentIds: importedIds, count: importedIds.length });
  },
);

router.post(
  '/:organizationId/applications/:applicationId/route',
  requireOrganizationIsolation(resolveOrganizationIdFromParams),
  requirePermission('application.assign'),
  auditLogger('workflow', 'application_rerouted', 'application'),
  (req, res) => {
    const db = req.app.locals.db;
    const app = db.prepare(`
      SELECT request_id, service_type, assigned_organization_id
      FROM service_requests
      WHERE request_id = ?
    `).get(req.params.applicationId);

    if (!app) {
      return res.status(404).json({ success: false, error: 'Application not found.' });
    }

    if (app.assigned_organization_id !== req.params.organizationId) {
      return res.status(403).json({ success: false, error: 'Application does not belong to this organization.' });
    }

    const route = routeApplication(db, {
      applicationId: app.request_id,
      serviceType: app.service_type,
    });

    return res.json({ success: true, route });
  },
);

router.post(
  '/:organizationId/applications/:applicationId/assign',
  requireOrganizationIsolation(resolveOrganizationIdFromParams),
  requirePermission('application.assign'),
  ensureDepartmentWorkflowScope,
  auditLogger('workflow', 'application_assigned', 'application'),
  (req, res) => {
    const db = req.app.locals.db;
    const { officerAdminUserId, priority = 'normal' } = req.body || {};
    if (!officerAdminUserId) {
      return res.status(400).json({ success: false, error: 'officerAdminUserId is required.' });
    }

    const app = db.prepare(`
      SELECT request_id, assigned_department_id
      FROM service_requests
      WHERE request_id = ?
    `).get(req.params.applicationId);
    if (!app) {
      return res.status(404).json({ success: false, error: 'Application not found.' });
    }

    const officer = db.prepare(`
      SELECT id, organization_id, department_id, status
      FROM admin_users
      WHERE id = ?
    `).get(officerAdminUserId);

    if (!officer || officer.status !== 'active') {
      return res.status(404).json({ success: false, error: 'Target officer not found or inactive.' });
    }

    if (officer.organization_id !== req.params.organizationId || officer.department_id !== app.assigned_department_id) {
      return res.status(400).json({
        success: false,
        error: 'Officer must belong to the same organization and department as the application.',
      });
    }

    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO application_assignments
      (id, application_id, department_id, assigned_to_admin_user_id, priority, assigned_by_admin_user_id, assigned_at, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
    `).run(
      crypto.randomUUID(),
      req.params.applicationId,
      app.assigned_department_id,
      officerAdminUserId,
      priority,
      req.auth.sub,
      now,
    );

    db.prepare('UPDATE service_requests SET workflow_state = ?, priority = ?, updated_at = ? WHERE request_id = ?').run(
      WORKFLOW_STATES.ASSIGNED,
      priority,
      now,
      req.params.applicationId,
    );

    db.prepare(`
      INSERT INTO workflow_history
      (id, application_id, previous_state, next_state, actor_type, actor_id, comments, created_at)
      VALUES (?, ?, ?, ?, 'admin', ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      req.params.applicationId,
      WORKFLOW_STATES.SUBMITTED,
      WORKFLOW_STATES.ASSIGNED,
      req.auth.sub,
      `Assigned to ${officerAdminUserId}`,
      now,
    );

    req.app.locals.io?.to(`department:${app.assigned_department_id}`).emit('application:assigned', {
      applicationId: req.params.applicationId,
      officerAdminUserId,
      assignedBy: req.auth.sub,
      timestamp: now,
    });

    return res.json({ success: true });
  },
);

router.post(
  '/:organizationId/applications/:applicationId/workflow',
  requireOrganizationIsolation(resolveOrganizationIdFromParams),
  requirePermission('application.workflow.update'),
  ensureDepartmentWorkflowScope,
  auditLogger('workflow', 'application_workflow_updated', 'application'),
  (req, res) => {
    const db = req.app.locals.db;
    const { nextState, comments } = req.body || {};

    if (!nextState || !validateWorkflowState(nextState)) {
      return res.status(400).json({ success: false, error: 'Invalid workflow state.' });
    }

    const app = db.prepare(`
      SELECT request_id, workflow_state, assigned_department_id
      FROM service_requests
      WHERE request_id = ?
    `).get(req.params.applicationId);
    if (!app) {
      return res.status(404).json({ success: false, error: 'Application not found.' });
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE service_requests SET workflow_state = ?, updated_at = ? WHERE request_id = ?').run(
      nextState,
      now,
      req.params.applicationId,
    );

    db.prepare(`
      INSERT INTO workflow_history
      (id, application_id, previous_state, next_state, actor_type, actor_id, comments, created_at)
      VALUES (?, ?, ?, ?, 'admin', ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      req.params.applicationId,
      app.workflow_state || WORKFLOW_STATES.SUBMITTED,
      nextState,
      req.auth.sub,
      comments || null,
      now,
    );

    req.app.locals.io?.to(`department:${app.assigned_department_id}`).emit('workflow:updated', {
      applicationId: req.params.applicationId,
      previousState: app.workflow_state || WORKFLOW_STATES.SUBMITTED,
      nextState,
      actorId: req.auth.sub,
      timestamp: now,
    });

    return res.json({ success: true, previousState: app.workflow_state, nextState });
  },
);

router.post(
  '/:organizationId/applications/:applicationId/actions',
  requireOrganizationIsolation(resolveOrganizationIdFromParams),
  requirePermission('application.workflow.update'),
  ensureDepartmentWorkflowScope,
  auditLogger('workflow', 'application_action_executed', 'application'),
  (req, res) => {
    const db = req.app.locals.db;
    const { action, comments, reason } = req.body || {};
    const actionType = String(action || '').toLowerCase();
    const actionToState = {
      approve: WORKFLOW_STATES.APPROVED,
      reject: WORKFLOW_STATES.REJECTED,
      escalate: WORKFLOW_STATES.ESCALATED,
      request_documents: WORKFLOW_STATES.DOCUMENTS_REQUESTED,
      mark_verified: WORKFLOW_STATES.VERIFICATION_PENDING,
      complete_workflow: WORKFLOW_STATES.COMPLETED,
    };

    const nextState = actionToState[actionType];
    if (!nextState) {
      return res.status(400).json({ success: false, error: 'Invalid action.' });
    }

    const app = db.prepare(`
      SELECT request_id, workflow_state, assigned_department_id, assigned_officer_admin_user_id
      FROM service_requests
      WHERE request_id = ?
    `).get(req.params.applicationId);
    if (!app) {
      return res.status(404).json({ success: false, error: 'Application not found.' });
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE service_requests SET workflow_state = ?, updated_at = ? WHERE request_id = ?').run(
      nextState,
      now,
      req.params.applicationId,
    );

    db.prepare(`
      INSERT INTO workflow_history
      (id, application_id, previous_state, next_state, actor_type, actor_id, comments, created_at)
      VALUES (?, ?, ?, ?, 'admin', ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      req.params.applicationId,
      app.workflow_state || WORKFLOW_STATES.SUBMITTED,
      nextState,
      req.auth.sub,
      comments || reason || `Action: ${actionType}`,
      now,
    );

    if (actionType === 'escalate') {
      const currentLevel = db.prepare('SELECT COUNT(*) AS c FROM escalation_logs WHERE application_id = ?').get(req.params.applicationId).c;
      db.prepare(`
        INSERT INTO escalation_logs (id, application_id, level, escalated_to_role, reason, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        crypto.randomUUID(),
        req.params.applicationId,
        Number(currentLevel || 0) + 1,
        'DEPARTMENT_HEAD',
        reason || comments || 'Escalated from portal',
        now,
      );
    }

    db.prepare(`
      INSERT INTO notifications (id, recipient_user_id, application_id, channel, event_type, payload, status, created_at)
      VALUES (?, ?, ?, 'in_app', ?, ?, 'queued', ?)
    `).run(
      crypto.randomUUID(),
      null,
      req.params.applicationId,
      `application_${actionType}`,
      JSON.stringify({
        applicationId: req.params.applicationId,
        action: actionType,
        comments: comments || null,
        actorId: req.auth.sub,
      }),
      now,
    );

    req.app.locals.io?.to(`department:${app.assigned_department_id}`).emit('workflow:updated', {
      applicationId: req.params.applicationId,
      previousState: app.workflow_state || WORKFLOW_STATES.SUBMITTED,
      nextState,
      action: actionType,
      actorId: req.auth.sub,
      timestamp: now,
    });

    if (app.assigned_officer_admin_user_id) {
      req.app.locals.io?.to(`officer:${app.assigned_officer_admin_user_id}`).emit('application:action', {
        applicationId: req.params.applicationId,
        action: actionType,
        nextState,
        timestamp: now,
      });
    }

    return res.json({
      success: true,
      action: actionType,
      previousState: app.workflow_state || WORKFLOW_STATES.SUBMITTED,
      nextState,
    });
  },
);

router.post(
  '/:organizationId/applications/:applicationId/notes',
  requireOrganizationIsolation(resolveOrganizationIdFromParams),
  requirePermission('application.view.department'),
  ensureDepartmentWorkflowScope,
  auditLogger('workflow', 'application_note_added', 'application'),
  (req, res) => {
    const db = req.app.locals.db;
    const { note } = req.body || {};
    if (!note || String(note).trim().length < 3) {
      return res.status(400).json({ success: false, error: 'note is required.' });
    }
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO workflow_history
      (id, application_id, previous_state, next_state, actor_type, actor_id, comments, created_at)
      VALUES (?, ?, NULL, 'Internal Note', 'admin', ?, ?, ?)
    `).run(crypto.randomUUID(), req.params.applicationId, req.auth.sub, `NOTE: ${note}`, now);
    return res.status(201).json({ success: true });
  },
);

router.post(
  '/:organizationId/applications/:applicationId/documents/:documentId/verify',
  requireOrganizationIsolation(resolveOrganizationIdFromParams),
  requirePermission('document.view'),
  ensureDepartmentWorkflowScope,
  auditLogger('document', 'application_document_verified', 'application_document'),
  (req, res) => {
    const db = req.app.locals.db;
    const now = new Date().toISOString();
    const updated = db.prepare(`
      UPDATE application_documents
      SET verification_status = 'verified'
      WHERE id = ? AND application_id = ?
    `).run(req.params.documentId, req.params.applicationId);
    if (!updated.changes) {
      return res.status(404).json({ success: false, error: 'Document not found.' });
    }
    db.prepare(`
      INSERT INTO workflow_history
      (id, application_id, previous_state, next_state, actor_type, actor_id, comments, created_at)
      VALUES (?, ?, NULL, 'Document Verified', 'admin', ?, ?, ?)
    `).run(crypto.randomUUID(), req.params.applicationId, req.auth.sub, `Document ${req.params.documentId} marked verified`, now);
    return res.json({ success: true });
  },
);

router.get(
  '/:organizationId/departments/:departmentId/queues',
  requireOrganizationIsolation(resolveOrganizationIdFromParams),
  requireDepartmentIsolation((req) => req.params.departmentId),
  requirePermission('application.assign'),
  (req, res) => {
    const db = req.app.locals.db;
    const rows = db.prepare(`
      SELECT id, code, name, priority_order, active
      FROM queues
      WHERE department_id = ?
      ORDER BY priority_order ASC, name ASC
    `).all(req.params.departmentId);
    return res.json({ success: true, queues: rows });
  },
);

router.get(
  '/:organizationId/departments/:departmentId/officers',
  requireOrganizationIsolation(resolveOrganizationIdFromParams),
  requireDepartmentIsolation((req) => req.params.departmentId),
  requirePermission('application.assign'),
  (req, res) => {
    const db = req.app.locals.db;
    const officers = db.prepare(`
      SELECT id, employee_id, full_name, official_email, role_id
      FROM admin_users
      WHERE organization_id = ? AND department_id = ? AND status = 'active'
      ORDER BY full_name
    `).all(req.params.organizationId, req.params.departmentId);
    return res.json({ success: true, officers });
  },
);

export default router;
