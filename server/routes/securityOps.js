import { Router } from 'express';
import { randomUUID } from 'crypto';
import { verifyJWT, requirePermission, auditLogger } from '../middleware/authMiddleware.js';
import { ADMIN_PERMISSIONS } from '../config/enterpriseRbac.js';

const router = Router();

router.get(
  '/incidents',
  verifyJWT,
  requirePermission(ADMIN_PERMISSIONS.SECURITY_MONITOR),
  (req, res) => {
    const db = req.app.locals.db;
    const rows = db.prepare(`
      SELECT
        id,
        category,
        severity,
        description,
        source_ip AS sourceIp,
        device_fingerprint AS deviceFingerprint,
        kiosk_id AS kioskId,
        admin_user_id AS adminUserId,
        status,
        detected_at AS detectedAt,
        resolved_at AS resolvedAt
      FROM security_incidents
      ORDER BY detected_at DESC
      LIMIT 200
    `).all();
    return res.json({ success: true, data: rows });
  }
);

router.post(
  '/incidents',
  verifyJWT,
  requirePermission(ADMIN_PERMISSIONS.SECURITY_MONITOR),
  auditLogger('SECURITY_INCIDENT_CREATE', 'security_incident'),
  (req, res) => {
    const db = req.app.locals.db;
    const { category, severity, description, kioskId, sourceIp, deviceFingerprint } = req.body || {};
    if (!category || !severity || !description) {
      return res.status(400).json({ success: false, error: 'category, severity, description are required.' });
    }
    const incidentId = randomUUID();
    db.prepare(`
      INSERT INTO security_incidents
      (id, category, severity, description, source_ip, device_fingerprint, kiosk_id, admin_user_id, status, detected_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', datetime('now'))
    `).run(incidentId, category, severity, description, sourceIp || null, deviceFingerprint || null, kioskId || null, req.user.sub || null);
    return res.status(201).json({ success: true, incidentId });
  }
);

router.get(
  '/audit-logs',
  verifyJWT,
  requirePermission(ADMIN_PERMISSIONS.AUDIT_READ),
  (req, res) => {
    const db = req.app.locals.db;
    const rows = db.prepare(`
      SELECT
        id,
        actor_type AS actorType,
        actor_id AS actorId,
        action,
        entity_type AS entityType,
        entity_id AS entityId,
        department_id AS departmentId,
        ip_address AS ipAddress,
        created_at AS createdAt
      FROM audit_logs
      ORDER BY created_at DESC
      LIMIT 300
    `).all();
    return res.json({ success: true, data: rows });
  }
);

export default router;

