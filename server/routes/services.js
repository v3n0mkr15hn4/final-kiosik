/**
 * Service Request Routes — Submit & manage service requests
 * Handles: electricity, gas, water, sanitation, municipal, healthcare
 */

import { Router } from 'express';
import { routeApplication } from '../enterprise/services/routingService.js';
import { WORKFLOW_STATES } from '../enterprise/config/constants.js';

const router = Router();

// Helper: generate request ID matching frontend pattern
function generateRequestId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SVD-${timestamp}-${random}`;
}

// POST /api/service-requests
router.post('/', (req, res) => {
  const {
    serviceType, serviceCategory, citizenName, mobile, email,
    consumerNumber, meterNumber, connectionId, propertyId, healthCardNumber,
    state, city, ward, address, description,
    preferredDate, preferredTime, aadhaarUid,
  } = req.body;

  // Validation
  if (!serviceType || !serviceCategory) {
    return res.status(400).json({ success: false, error: 'Service type and category are required.' });
  }
  if (!citizenName || !mobile) {
    return res.status(400).json({ success: false, error: 'Citizen name and mobile are required.' });
  }

  const db = req.app.locals.db;
  const requestId = generateRequestId();
  const now = new Date().toISOString();

  try {
    db.prepare(`
      INSERT INTO service_requests 
      (request_id, service_type, service_category, citizen_name, mobile, email, aadhaar_uid,
       consumer_number, meter_number, connection_id, property_id, health_card_number,
       state, city, ward, address, description, preferred_date, preferred_time, status, workflow_state, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?, ?, ?)
    `).run(
      requestId, serviceType, serviceCategory, citizenName, mobile, email || null, aadhaarUid || null,
      consumerNumber || null, meterNumber || null, connectionId || null, propertyId || null, healthCardNumber || null,
      state || null, city || null, ward || null, address || null, description || null,
      preferredDate || null, preferredTime || null, WORKFLOW_STATES.SUBMITTED, now, now
    );

    // Add timeline event
    db.prepare(`
      INSERT INTO timeline_events (request_id, request_type, status, description, created_at)
      VALUES (?, 'service', 'submitted', 'Request submitted successfully', ?)
    `).run(requestId, now);

    // Enterprise routing engine: maps service type -> organization/department/queue with SLA.
    const routeResult = routeApplication(db, { applicationId: requestId, serviceType });
    req.app.locals.io?.to(`department:${routeResult.departmentId}`).emit('application:routed', {
      requestId,
      serviceType,
      ...routeResult,
      timestamp: now,
    });

    return res.status(201).json({
      success: true,
      requestId,
      status: 'submitted',
      workflowState: WORKFLOW_STATES.ASSIGNED,
      routing: routeResult,
      timestamp: now,
    });
  } catch (err) {
    console.error('[SERVICE-REQUEST]', err.message);
    return res.status(500).json({ success: false, error: 'Failed to submit service request.' });
  }
});

// GET /api/service-requests/:requestId
router.get('/:requestId', (req, res) => {
  const db = req.app.locals.db;
  const row = db.prepare('SELECT * FROM service_requests WHERE request_id = ?').get(req.params.requestId);

  if (!row) {
    return res.status(404).json({ success: false, error: 'Service request not found.' });
  }

  const timeline = db.prepare(
    'SELECT status, description, created_at as timestamp FROM timeline_events WHERE request_id = ? ORDER BY created_at ASC'
  ).all(req.params.requestId);

  return res.json({
    success: true,
    data: {
      requestId: row.request_id,
      serviceType: row.service_type,
      serviceCategory: row.service_category,
      citizenName: row.citizen_name,
      mobile: row.mobile,
      email: row.email,
      status: row.status,
      submittedAt: row.created_at,
      lastUpdated: row.updated_at,
      timeline,
    },
  });
});

// GET /api/service-requests (list all, with optional filters)
router.get('/', (req, res) => {
  const { status, serviceType, page = 1, limit = 20 } = req.query;
  const db = req.app.locals.db;

  let sql = 'SELECT * FROM service_requests WHERE 1=1';
  const params = [];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (serviceType) {
    sql += ' AND service_type = ?';
    params.push(serviceType);
  }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), (Number(page) - 1) * Number(limit));

  const rows = db.prepare(sql).all(...params);
  const total = db.prepare('SELECT COUNT(*) as c FROM service_requests').get().c;

  return res.json({
    success: true,
    data: rows.map(r => ({
      requestId: r.request_id,
      serviceType: r.service_type,
      serviceCategory: r.service_category,
      citizenName: r.citizen_name,
      mobile: r.mobile,
      status: r.status,
      submittedAt: r.created_at,
    })),
    pagination: { page: Number(page), limit: Number(limit), total },
  });
});

export default router;
