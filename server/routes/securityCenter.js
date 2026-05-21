import { Router } from 'express';
import crypto from 'crypto';
import { requirePermission } from '../middleware/enterprise/authz.js';
import { auditLogger } from '../middleware/enterprise/auditLogger.js';
import { requireSecurityCenterRole } from '../middleware/enterprise/isolation.js';

const router = Router();

router.use(requireSecurityCenterRole);

router.get('/incidents', requirePermission('security.incident.view'), (req, res) => {
  const db = req.app.locals.db;
  const incidents = db.prepare(`
    SELECT *
    FROM security_incidents
    ORDER BY created_at DESC
    LIMIT 500
  `).all();
  return res.json({ success: true, incidents });
});

router.post(
  '/incidents',
  requirePermission('security.incident.manage'),
  auditLogger('security', 'incident_created', 'security_incident'),
  (req, res) => {
    const db = req.app.locals.db;
    const { incidentType, severity, details, ipAddress } = req.body || {};
    if (!incidentType || !severity) {
      return res.status(400).json({ success: false, error: 'incidentType and severity are required.' });
    }

    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO security_incidents
      (id, incident_type, severity, actor_id, ip_address, details_json, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'open', ?)
    `).run(
      id,
      incidentType,
      severity,
      req.auth.sub,
      ipAddress || req.ip || null,
      details ? JSON.stringify(details) : null,
      new Date().toISOString(),
    );

    req.app.locals.io?.emit('security:alert', {
      id,
      incidentType,
      severity,
      status: 'open',
      createdAt: new Date().toISOString(),
    });

    return res.status(201).json({ success: true, incidentId: id });
  },
);

router.patch(
  '/incidents/:incidentId',
  requirePermission('security.incident.manage'),
  auditLogger('security', 'incident_updated', 'security_incident'),
  (req, res) => {
    const db = req.app.locals.db;
    const { status } = req.body || {};
    if (!['open', 'investigating', 'resolved'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid incident status.' });
    }

    db.prepare('UPDATE security_incidents SET status = ? WHERE id = ?').run(status, req.params.incidentId);
    return res.json({ success: true });
  },
);

router.get('/audit-logs', requirePermission('audit.view'), (req, res) => {
  const db = req.app.locals.db;
  const logs = db.prepare(`
    SELECT *
    FROM audit_logs
    ORDER BY created_at DESC
    LIMIT 1000
  `).all();
  return res.json({ success: true, logs });
});

router.get('/tampering-alerts', requirePermission('security.incident.view'), (req, res) => {
  const db = req.app.locals.db;
  const alerts = db.prepare(`
    SELECT k.kiosk_code, k.location_name, h.suspicious_activity, h.created_at
    FROM kiosk_health_logs h
    JOIN kiosks k ON k.id = h.kiosk_id
    WHERE h.suspicious_activity = 1
    ORDER BY h.created_at DESC
    LIMIT 200
  `).all();
  return res.json({ success: true, alerts });
});

export default router;
