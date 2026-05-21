/**
 * Alert Routes — Emergency alerts
 */

import { Router } from 'express';

const router = Router();

// GET /api/alerts/emergency
router.get('/emergency', (req, res) => {
  const db = req.app.locals.db;
  const alerts = db.prepare('SELECT * FROM alerts WHERE active = 1 ORDER BY created_at DESC').all();

  return res.json({
    alerts: alerts.map(a => ({
      id: a.id,
      type: a.type,
      severity: a.severity,
      title: a.title,
      titleHi: a.title_hi,
      titleTa: a.title_ta,
      message: a.message,
      messageHi: a.message_hi,
      messageTa: a.message_ta,
      source: a.source,
      timestamp: a.created_at,
      active: !!a.active,
    })),
  });
});

// POST /api/alerts/emergency (admin — create new alert)
router.post('/emergency', (req, res) => {
  const { type, severity, title, titleHi, titleTa, message, messageHi, messageTa, source } = req.body;

  if (!type || !severity || !title || !message) {
    return res.status(400).json({ success: false, error: 'Type, severity, title, and message are required.' });
  }

  const db = req.app.locals.db;
  const id = `alert-${Date.now()}`;

  db.prepare(`
    INSERT INTO alerts (id, type, severity, title, title_hi, title_ta, message, message_hi, message_ta, source, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(id, type, severity, title, titleHi || null, titleTa || null, message, messageHi || null, messageTa || null, source || null);

  return res.status(201).json({ success: true, alertId: id });
});

export default router;
