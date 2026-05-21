/**
 * Notification Routes — Send receipt via SMS/WhatsApp
 */

import { Router } from 'express';

const router = Router();

// POST /api/notifications/send-receipt
router.post('/send-receipt', (req, res) => {
  const { mobile, method, documentType, documentId } = req.body;

  if (!mobile || !method) {
    return res.status(400).json({ success: false, error: 'Mobile number and method are required.' });
  }

  if (!/^[6-9]\d{9}$/.test(mobile)) {
    return res.status(400).json({ success: false, error: 'Invalid mobile number.' });
  }

  if (!['sms', 'whatsapp'].includes(method)) {
    return res.status(400).json({ success: false, error: 'Method must be sms or whatsapp.' });
  }

  const db = req.app.locals.db;
  const now = new Date().toISOString();

  // Log the notification
  db.prepare(`
    INSERT INTO notifications (mobile, method, document_type, document_id, status, created_at)
    VALUES (?, ?, ?, ?, 'sent', ?)
  `).run(mobile, method, documentType || 'Receipt', documentId || null, now);

  // In production, integrate with SMS/WhatsApp gateway here
  console.log(`  📤  ${method.toUpperCase()} notification sent to ${mobile} for ${documentType} ${documentId}`);

  return res.json({
    success: true,
    message: `${documentType || 'Receipt'} sent via ${method} to ${mobile}`,
    timestamp: now,
  });
});

export default router;
