/**
 * Track Routes — Search requests/complaints by ID or mobile
 */

import { Router } from 'express';

const router = Router();

// GET /api/track?requestId=SVD-TEST-001  OR  ?mobile=9876543210
router.get('/', (req, res) => {
  const { requestId, mobile } = req.query;

  if (!requestId && !mobile) {
    return res.status(400).json({ success: false, error: 'Provide requestId or mobile to search.' });
  }

  const db = req.app.locals.db;
  let results = [];

  if (requestId) {
    // Search in service_requests
    const sr = db.prepare('SELECT * FROM service_requests WHERE request_id = ?').get(requestId.toUpperCase());
    if (sr) {
      const timeline = db.prepare(
        'SELECT status, description, created_at as timestamp FROM timeline_events WHERE request_id = ? ORDER BY created_at ASC'
      ).all(sr.request_id);

      results.push({
        requestId: sr.request_id,
        citizenName: sr.citizen_name,
        mobile: sr.mobile,
        serviceCategory: sr.service_category,
        status: sr.status,
        submittedAt: sr.created_at,
        lastUpdated: sr.updated_at,
        timeline,
      });
    }

    // Search in complaints
    const cmp = db.prepare('SELECT * FROM complaints WHERE complaint_id = ?').get(requestId.toUpperCase());
    if (cmp) {
      const timeline = db.prepare(
        'SELECT status, description, created_at as timestamp FROM timeline_events WHERE request_id = ? ORDER BY created_at ASC'
      ).all(cmp.complaint_id);

      results.push({
        requestId: cmp.complaint_id,
        citizenName: cmp.citizen_name,
        mobile: cmp.mobile,
        serviceCategory: `Complaint - ${cmp.complaint_type}`,
        status: cmp.status,
        submittedAt: cmp.created_at,
        lastUpdated: cmp.updated_at,
        timeline,
      });
    }
  }

  if (mobile) {
    // Search all service requests by mobile
    const serviceRows = db.prepare(
      'SELECT * FROM service_requests WHERE mobile = ? ORDER BY created_at DESC LIMIT 10'
    ).all(mobile);

    for (const sr of serviceRows) {
      const timeline = db.prepare(
        'SELECT status, description, created_at as timestamp FROM timeline_events WHERE request_id = ? ORDER BY created_at ASC'
      ).all(sr.request_id);

      results.push({
        requestId: sr.request_id,
        citizenName: sr.citizen_name,
        mobile: sr.mobile,
        serviceCategory: sr.service_category,
        status: sr.status,
        submittedAt: sr.created_at,
        lastUpdated: sr.updated_at,
        timeline,
      });
    }

    // Search complaints by mobile
    const complaintRows = db.prepare(
      'SELECT * FROM complaints WHERE mobile = ? ORDER BY created_at DESC LIMIT 10'
    ).all(mobile);

    for (const cmp of complaintRows) {
      const timeline = db.prepare(
        'SELECT status, description, created_at as timestamp FROM timeline_events WHERE request_id = ? ORDER BY created_at ASC'
      ).all(cmp.complaint_id);

      results.push({
        requestId: cmp.complaint_id,
        citizenName: cmp.citizen_name,
        mobile: cmp.mobile,
        serviceCategory: `Complaint - ${cmp.complaint_type}`,
        status: cmp.status,
        submittedAt: cmp.created_at,
        lastUpdated: cmp.updated_at,
        timeline,
      });
    }
  }

  if (results.length === 0) {
    return res.status(404).json({ success: false, error: 'No requests found.' });
  }

  // If searching by requestId, return single result for backward compatibility
  if (requestId && results.length === 1) {
    return res.json({ success: true, data: results[0] });
  }

  return res.json({ success: true, data: results });
});

export default router;
