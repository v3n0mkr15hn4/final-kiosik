import { Router } from 'express';
import crypto from 'crypto';
import { requirePermission, requireRole } from '../middleware/enterprise/authz.js';
import { auditLogger } from '../middleware/enterprise/auditLogger.js';
import { ADMIN_ROLES } from '../enterprise/config/constants.js';

const router = Router();

router.use(requireRole([ADMIN_ROLES.SUPER_ADMIN]));

router.get('/overview', requirePermission('analytics.system.view'), (req, res) => {
  const db = req.app.locals.db;
  const organizations = db.prepare('SELECT COUNT(*) AS c FROM organizations WHERE status = ?').get('active').c;
  const kiosks = db.prepare('SELECT COUNT(*) AS c FROM kiosks').get().c;
  const applications = db.prepare('SELECT COUNT(*) AS c FROM service_requests').get().c;
  const openIncidents = db.prepare('SELECT COUNT(*) AS c FROM security_incidents WHERE status = ?').get('open').c;

  return res.json({
    success: true,
    data: {
      activeOrganizations: organizations,
      totalKiosks: kiosks,
      totalApplications: applications,
      openSecurityIncidents: openIncidents,
    },
  });
});

router.get('/organizations', requirePermission('analytics.system.view'), (req, res) => {
  const db = req.app.locals.db;
  const rows = db.prepare(`
    SELECT o.id, o.code, o.name, o.type, o.status,
           COUNT(DISTINCT d.id) AS departments,
           COUNT(DISTINCT u.id) AS adminUsers
    FROM organizations o
    LEFT JOIN departments d ON d.organization_id = o.id
    LEFT JOIN admin_users u ON u.organization_id = o.id
    GROUP BY o.id, o.code, o.name, o.type, o.status
    ORDER BY o.name
  `).all();
  return res.json({ success: true, organizations: rows });
});

router.post(
  '/organizations',
  requirePermission('analytics.system.view'),
  auditLogger('admin', 'organization_created', 'organization'),
  (req, res) => {
    const db = req.app.locals.db;
    const { code, name, type = 'department' } = req.body || {};
    if (!code || !name) {
      return res.status(400).json({ success: false, error: 'code and name are required.' });
    }

    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO organizations (id, code, name, type, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'active', ?, ?)
    `).run(id, code.toUpperCase(), name, type, new Date().toISOString(), new Date().toISOString());

    return res.status(201).json({ success: true, organizationId: id });
  },
);

router.patch(
  '/organizations/:organizationId/status',
  requirePermission('analytics.system.view'),
  auditLogger('admin', 'organization_status_updated', 'organization'),
  (req, res) => {
    const db = req.app.locals.db;
    const { status } = req.body || {};
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, error: 'status must be active or inactive.' });
    }

    db.prepare('UPDATE organizations SET status = ?, updated_at = ? WHERE id = ?').run(
      status,
      new Date().toISOString(),
      req.params.organizationId,
    );

    return res.json({ success: true });
  },
);

router.get('/rbac/roles', requirePermission('analytics.system.view'), (req, res) => {
  const db = req.app.locals.db;
  const roles = db.prepare('SELECT id, code, name, scope FROM admin_roles ORDER BY code').all();
  return res.json({ success: true, roles });
});

router.get('/rbac/permissions', requirePermission('analytics.system.view'), (req, res) => {
  const db = req.app.locals.db;
  const permissions = db.prepare('SELECT id, code, description FROM admin_permissions ORDER BY code').all();
  return res.json({ success: true, permissions });
});

router.get('/kiosks', requirePermission('analytics.system.view'), (req, res) => {
  const db = req.app.locals.db;
  const rows = db.prepare(`
    SELECT k.*, o.name AS organization_name, d.name AS department_name
    FROM kiosks k
    LEFT JOIN organizations o ON o.id = k.organization_id
    LEFT JOIN departments d ON d.id = k.department_id
    ORDER BY k.kiosk_code
  `).all();
  return res.json({ success: true, kiosks: rows });
});

router.get('/kiosks/:kioskId/maintenance', requirePermission('analytics.system.view'), (req, res) => {
  const db = req.app.locals.db;
  const logs = db.prepare(`
    SELECT *
    FROM maintenance_logs
    WHERE kiosk_id = ?
    ORDER BY created_at DESC
    LIMIT 200
  `).all(req.params.kioskId);

  return res.json({ success: true, maintenanceLogs: logs });
});

export default router;
