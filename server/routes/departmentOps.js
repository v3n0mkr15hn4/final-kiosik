import { Router } from 'express';
import { randomUUID } from 'crypto';
import { verifyJWT, requirePermission, requireDepartmentOwnership, auditLogger } from '../middleware/authMiddleware.js';
import { ADMIN_PERMISSIONS } from '../config/enterpriseRbac.js';

const router = Router();

router.get(
  '/departments/:departmentId/queues',
  verifyJWT,
  requirePermission(ADMIN_PERMISSIONS.QUEUE_MANAGE),
  requireDepartmentOwnership({ source: 'params', field: 'departmentId' }),
  (req, res) => {
    const db = req.app.locals.db;
    const rows = db.prepare(`
      SELECT id, code, name, priority
      FROM queues
      WHERE department_id = ?
      ORDER BY priority ASC, name ASC
    `).all(req.params.departmentId);
    return res.json({ success: true, data: rows });
  }
);

router.post(
  '/departments/:departmentId/queues',
  verifyJWT,
  requirePermission(ADMIN_PERMISSIONS.QUEUE_MANAGE),
  requireDepartmentOwnership({ source: 'params', field: 'departmentId' }),
  auditLogger('QUEUE_CREATE', 'queue'),
  (req, res) => {
    const db = req.app.locals.db;
    const { code, name, priority } = req.body || {};
    if (!code || !name) return res.status(400).json({ success: false, error: 'code and name are required.' });
    const id = randomUUID();
    db.prepare(`
      INSERT INTO queues (id, department_id, code, name, priority, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).run(id, req.params.departmentId, code, name, Number(priority || 5));
    return res.status(201).json({ success: true, queueId: id });
  }
);

router.get(
  '/departments/:departmentId/officers',
  verifyJWT,
  requirePermission(ADMIN_PERMISSIONS.OFFICER_ASSIGN),
  requireDepartmentOwnership({ source: 'params', field: 'departmentId' }),
  (req, res) => {
    const db = req.app.locals.db;
    const officers = db.prepare(`
      SELECT
        id,
        employee_id AS employeeId,
        official_email AS officialEmail,
        full_name AS fullName
      FROM admin_users
      WHERE department_id = ? AND status = 'active'
      ORDER BY full_name ASC
    `).all(req.params.departmentId);
    return res.json({ success: true, data: officers });
  }
);

export default router;

