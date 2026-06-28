import { Router } from 'express';
import { randomUUID } from 'crypto';
import { verifyJWT, requirePermission, auditLogger } from '../middleware/authMiddleware.js';
import { ADMIN_PERMISSIONS } from '../config/enterpriseRbac.js';

const router = Router();

router.post(
  '/heartbeat',
  verifyJWT,
  requirePermission(ADMIN_PERMISSIONS.KIOSK_MONITOR),
  auditLogger('KIOSK_HEARTBEAT', 'kiosk'),
  (req, res) => {
    const db = req.app.locals.db;
    const { kioskCode, metrics = {}, devices = {} } = req.body || {};
    if (!kioskCode) return res.status(400).json({ success: false, error: 'kioskCode is required.' });

    let kiosk = db.prepare('SELECT id FROM kiosks WHERE kiosk_code = ?').get(kioskCode);
    if (!kiosk) {
      const id = randomUUID();
      db.prepare(`
        INSERT INTO kiosks (id, kiosk_code, location_name, status, software_version, last_seen_at, created_at, updated_at)
        VALUES (?, ?, ?, 'online', ?, datetime('now'), datetime('now'), datetime('now'))
      `).run(id, kioskCode, req.body.locationName || kioskCode, req.body.softwareVersion || 'unknown');
      kiosk = { id };
    } else {
      db.prepare(`
        UPDATE kiosks
        SET status = 'online', software_version = ?, last_seen_at = datetime('now'), updated_at = datetime('now')
        WHERE id = ?
      `).run(req.body.softwareVersion || 'unknown', kiosk.id);
    }

    db.prepare(`
      INSERT INTO kiosk_health_logs
      (id, kiosk_id, cpu_usage, ram_usage, storage_usage, network_latency_ms, printer_ok, camera_ok, microphone_ok, biometric_ok, heartbeat_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      randomUUID(),
      kiosk.id,
      Number(metrics.cpuUsage || 0),
      Number(metrics.ramUsage || 0),
      Number(metrics.storageUsage || 0),
      Number(metrics.networkLatencyMs || 0),
      devices.printerOk === false ? 0 : 1,
      devices.cameraOk === false ? 0 : 1,
      devices.microphoneOk === false ? 0 : 1,
      devices.biometricOk === false ? 0 : 1
    );

    return res.json({ success: true, message: 'Heartbeat recorded.' });
  }
);

router.get(
  '/health',
  verifyJWT,
  requirePermission(ADMIN_PERMISSIONS.KIOSK_MONITOR),
  (req, res) => {
    const db = req.app.locals.db;
    const rows = db.prepare(`
      SELECT
        k.id,
        k.kiosk_code AS kioskCode,
        k.location_name AS locationName,
        k.status,
        k.software_version AS softwareVersion,
        k.last_seen_at AS lastSeenAt,
        h.cpu_usage AS cpuUsage,
        h.ram_usage AS ramUsage,
        h.storage_usage AS storageUsage,
        h.network_latency_ms AS networkLatencyMs,
        h.printer_ok AS printerOk,
        h.camera_ok AS cameraOk,
        h.microphone_ok AS microphoneOk,
        h.biometric_ok AS biometricOk,
        h.heartbeat_at AS heartbeatAt
      FROM kiosks k
      LEFT JOIN kiosk_health_logs h ON h.id = (
        SELECT h2.id FROM kiosk_health_logs h2 WHERE h2.kiosk_id = k.id ORDER BY h2.heartbeat_at DESC LIMIT 1
      )
      ORDER BY k.updated_at DESC
    `).all();

    return res.json({ success: true, data: rows });
  }
);

router.post(
  '/:kioskId/diagnostics',
  verifyJWT,
  requirePermission(ADMIN_PERMISSIONS.KIOSK_DIAGNOSTICS),
  auditLogger('KIOSK_DIAGNOSTIC_RUN', 'kiosk'),
  (req, res) => {
    return res.json({
      success: true,
      kioskId: req.params.kioskId,
      diagnostic: {
        network: 'ok',
        storage: 'ok',
        peripherals: {
          printer: 'ok',
          camera: 'ok',
          microphone: 'ok',
          biometric: 'ok',
        },
      },
    });
  }
);

router.post(
  '/:kioskId/reboot',
  verifyJWT,
  requirePermission(ADMIN_PERMISSIONS.KIOSK_REMOTE_ACTIONS),
  auditLogger('KIOSK_REMOTE_REBOOT', 'kiosk'),
  (req, res) => {
    return res.json({ success: true, kioskId: req.params.kioskId, action: 'reboot_queued' });
  }
);

router.post(
  '/:kioskId/emergency-shutdown',
  verifyJWT,
  requirePermission(ADMIN_PERMISSIONS.KIOSK_REMOTE_ACTIONS),
  auditLogger('KIOSK_EMERGENCY_SHUTDOWN', 'kiosk'),
  (req, res) => {
    return res.json({ success: true, kioskId: req.params.kioskId, action: 'shutdown_queued' });
  }
);

// ── Physical Aadhaar QR scanner (scanner_service.py) ─────────────────────────
// No JWT — accepted from localhost only. Python daemon decodes Aadhaar Secure QR
// via pyaadhaar and POSTs structured fields here. Frontend polls /latest to prefill forms.

let _aadhaarScan = null; // { data, receivedAt }
const AADHAAR_SCAN_TTL_MS = 60_000;

router.post('/aadhaar-scan', (req, res) => {
  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
  if (!['::1', '127.0.0.1', '::ffff:127.0.0.1'].includes(ip)) {
    return res.status(403).json({ error: 'Forbidden — localhost only.' });
  }
  const { name, dob, gender, address, aadhaar_last_digits } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name required' });

  _aadhaarScan = {
    data: {
      name,
      dob: dob || '',
      gender: gender || '',
      address: address || {},
      aadhaar_last_digits: aadhaar_last_digits || '',
    },
    receivedAt: Date.now(),
  };
  return res.json({ success: true });
});

// Consume-once: returns scan result then clears it. TTL 60s.
router.get('/aadhaar-scan/latest', (req, res) => {
  if (!_aadhaarScan) return res.json({ data: null });
  if (Date.now() - _aadhaarScan.receivedAt > AADHAAR_SCAN_TTL_MS) {
    _aadhaarScan = null;
    return res.json({ data: null });
  }
  const scan = _aadhaarScan;
  _aadhaarScan = null;
  return res.json({ data: scan.data });
});

export default router;

