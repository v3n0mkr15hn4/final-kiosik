/**
 * Complaint Routes — Submit & track complaints
 */

import { Router } from 'express';

const router = Router();

// AI classification mock (in production, use ML model)
function classifyComplaint(type, description) {
  const departments = {
    roadDamage: 'Roads & Infrastructure',
    streetLight: 'Electrical Maintenance',
    waterLogging: 'Drainage & Storm Water',
    encroachment: 'Revenue & Enforcement',
    pollution: 'Environment & Pollution Control',
    publicSafety: 'Public Safety & Police',
    other: 'General Administration',
  };

  const priorities = {
    roadDamage: 'high',
    streetLight: 'medium',
    waterLogging: 'high',
    encroachment: 'medium',
    pollution: 'high',
    publicSafety: 'high',
    other: 'low',
  };

  return {
    department: departments[type] || 'General Administration',
    priority: priorities[type] || 'medium',
    duplicateCheck: false,
  };
}

// Helper: generate complaint ID matching frontend pattern
function generateComplaintId() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CMP-${year}${month}${day}-${random}`;
}

// POST /api/complaints
router.post('/', (req, res) => {
  const {
    complaintType, citizenName, mobile, email,
    state, city, ward, location, description, aadhaarUid,
  } = req.body;

  if (!complaintType || !citizenName || !mobile) {
    return res.status(400).json({ success: false, error: 'Complaint type, name, and mobile are required.' });
  }

  const db = req.app.locals.db;
  const complaintId = generateComplaintId();
  const now = new Date().toISOString();
  const aiResult = classifyComplaint(complaintType, description);

  try {
    db.prepare(`
      INSERT INTO complaints 
      (complaint_id, complaint_type, citizen_name, mobile, email, aadhaar_uid,
       state, city, ward, location, description, status,
       ai_department, ai_priority, ai_duplicate_check, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?, ?, ?, ?, ?)
    `).run(
      complaintId, complaintType, citizenName, mobile, email || null, aadhaarUid || null,
      state || null, city || null, ward || null, location || null, description || null,
      aiResult.department, aiResult.priority, aiResult.duplicateCheck ? 1 : 0,
      now, now
    );

    // Add timeline event
    db.prepare(`
      INSERT INTO timeline_events (request_id, request_type, status, description, created_at)
      VALUES (?, 'complaint', 'submitted', 'Complaint registered successfully', ?)
    `).run(complaintId, now);

    return res.status(201).json({
      success: true,
      complaintId,
      status: 'submitted',
      timestamp: now,
      aiClassification: aiResult,
    });
  } catch (err) {
    console.error('[COMPLAINT]', err.message);
    return res.status(500).json({ success: false, error: 'Failed to submit complaint.' });
  }
});

// GET /api/complaints/:complaintId
router.get('/:complaintId', (req, res) => {
  const db = req.app.locals.db;
  const row = db.prepare('SELECT * FROM complaints WHERE complaint_id = ?').get(req.params.complaintId);

  if (!row) {
    return res.status(404).json({ success: false, error: 'Complaint not found.' });
  }

  const timeline = db.prepare(
    'SELECT status, description, created_at as timestamp FROM timeline_events WHERE request_id = ? ORDER BY created_at ASC'
  ).all(req.params.complaintId);

  return res.json({
    success: true,
    data: {
      complaintId: row.complaint_id,
      complaintType: row.complaint_type,
      citizenName: row.citizen_name,
      mobile: row.mobile,
      status: row.status,
      aiClassification: {
        department: row.ai_department,
        priority: row.ai_priority,
        duplicateCheck: !!row.ai_duplicate_check,
      },
      submittedAt: row.created_at,
      lastUpdated: row.updated_at,
      timeline,
    },
  });
});

export default router;
