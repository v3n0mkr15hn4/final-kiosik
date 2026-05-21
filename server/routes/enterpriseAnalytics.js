import { Router } from 'express';
import { verifyJWT, requirePermission } from '../middleware/authMiddleware.js';
import { ADMIN_PERMISSIONS } from '../config/enterpriseRbac.js';

const router = Router();

router.get(
  '/department',
  verifyJWT,
  requirePermission(ADMIN_PERMISSIONS.ANALYTICS_READ),
  (req, res) => {
    const db = req.app.locals.db;
    const departmentId = req.user.role === 'super_admin' ? req.query.departmentId : req.user.departmentId;
    if (!departmentId) return res.status(400).json({ success: false, error: 'departmentId required.' });

    const statusBreakdown = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM applications_enterprise
      WHERE department_id = ?
      GROUP BY status
    `).all(departmentId);

    return res.json({ success: true, data: { departmentId, statusBreakdown } });
  }
);

router.get(
  '/kiosk',
  verifyJWT,
  requirePermission(ADMIN_PERMISSIONS.KIOSK_MONITOR),
  (req, res) => {
    const db = req.app.locals.db;
    const summary = db.prepare(`
      SELECT
        COUNT(*) AS totalKiosks,
        SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END) AS onlineKiosks,
        SUM(CASE WHEN status = 'offline' THEN 1 ELSE 0 END) AS offlineKiosks
      FROM kiosks
    `).get();
    return res.json({ success: true, data: summary });
  }
);

router.get(
  '/system',
  verifyJWT,
  requirePermission(ADMIN_PERMISSIONS.ANALYTICS_READ),
  (req, res) => {
    const db = req.app.locals.db;
    const appCount = db.prepare('SELECT COUNT(*) AS count FROM applications_enterprise').get().count;
    const incidentsOpen = db.prepare(`SELECT COUNT(*) AS count FROM security_incidents WHERE status = 'open'`).get().count;
    const auditEntries = db.prepare('SELECT COUNT(*) AS count FROM audit_logs').get().count;
    return res.json({
      success: true,
      data: {
        totalApplications: appCount,
        openSecurityIncidents: incidentsOpen,
        totalAuditEntries: auditEntries,
      },
    });
  }
);

export default router;

