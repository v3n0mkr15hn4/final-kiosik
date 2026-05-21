/**
 * Sync Routes — Replay offline pending submissions
 */

import { Router } from 'express';

const router = Router();

// POST /api/sync/pending — Batch sync offline submissions
router.post('/pending', (req, res) => {
  const { submissions } = req.body;

  if (!Array.isArray(submissions) || submissions.length === 0) {
    return res.status(400).json({ success: false, error: 'No submissions to sync.' });
  }

  const db = req.app.locals.db;
  let synced = 0;
  let failed = 0;
  const results = [];

  for (const sub of submissions) {
    try {
      const now = new Date().toISOString();
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      const requestId = `SVD-${timestamp}-${random}`;

      db.prepare(`
        INSERT INTO service_requests 
        (request_id, service_type, service_category, citizen_name, mobile, email,
         state, city, ward, address, description, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?, ?)
      `).run(
        requestId,
        sub.serviceType || 'general',
        sub.serviceCategory || 'General Request',
        sub.citizenName || sub.name || 'Unknown',
        sub.mobile || '',
        sub.email || null,
        sub.state || null,
        sub.city || null,
        sub.ward || null,
        sub.address || null,
        sub.description || null,
        sub.savedAt || now,
        now
      );

      db.prepare(`
        INSERT INTO timeline_events (request_id, request_type, status, description, created_at)
        VALUES (?, 'service', 'submitted', 'Request synced from offline queue', ?)
      `).run(requestId, now);

      synced++;
      results.push({ offlineId: sub.id, requestId, status: 'synced' });
    } catch (err) {
      failed++;
      results.push({ offlineId: sub.id, status: 'failed', error: err.message });
    }
  }

  return res.json({
    success: true,
    synced,
    failed,
    results,
  });
});

export default router;
