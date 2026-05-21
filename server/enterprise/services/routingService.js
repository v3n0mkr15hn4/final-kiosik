import crypto from 'crypto';
import { WORKFLOW_STATES } from '../config/constants.js';

function getDefaultRoutingForService(serviceType) {
  const mapping = {
    water: { departmentId: 'dept_water_ops', queueId: 'queue_water_field', slaHours: 24 },
    water_leakage: { departmentId: 'dept_water_ops', queueId: 'queue_water_field', slaHours: 24 },
    electricity: { departmentId: 'dept_elec_ops', queueId: 'queue_elec_field', slaHours: 48 },
    healthcare: { departmentId: 'dept_health_services', queueId: 'queue_health_review', slaHours: 72 },
    property_tax: { departmentId: 'dept_muni_revenue', queueId: 'queue_tax_review', slaHours: 168 },
    municipal: { departmentId: 'dept_muni_revenue', queueId: 'queue_tax_review', slaHours: 96 },
    sanitation: { departmentId: 'dept_muni_revenue', queueId: 'queue_tax_review', slaHours: 96 },
    gas: { departmentId: 'dept_muni_revenue', queueId: 'queue_tax_review', slaHours: 96 },
    transport: { departmentId: 'dept_muni_revenue', queueId: 'queue_tax_review', slaHours: 96 },
  };
  return mapping[serviceType] || { departmentId: 'dept_muni_revenue', queueId: 'queue_tax_review', slaHours: 96 };
}

export function routeApplication(db, { applicationId, serviceType }) {
  const mapped = db.prepare(`
    SELECT m.*, d.organization_id
    FROM service_department_mapping m
    JOIN departments d ON d.id = m.department_id
    WHERE m.service_type = ? AND m.active = 1
    LIMIT 1
  `).get(serviceType);

  const fallback = getDefaultRoutingForService(serviceType);
  const chosen = mapped || fallback;

  const organizationId = mapped?.organization_id || db.prepare(
    'SELECT organization_id FROM departments WHERE id = ? LIMIT 1'
  ).get(chosen.departmentId)?.organization_id;

  db.prepare(
    `UPDATE service_requests
     SET assigned_department_id = ?, assigned_organization_id = ?, assigned_queue_id = ?, workflow_state = ?, updated_at = ?
     WHERE request_id = ?`
  ).run(
    chosen.departmentId,
    organizationId || null,
    chosen.queueId || null,
    WORKFLOW_STATES.ASSIGNED,
    new Date().toISOString(),
    applicationId
  );

  db.prepare(
    `INSERT INTO application_assignments
     (id, application_id, department_id, queue_id, priority, status, assigned_at)
     VALUES (?, ?, ?, ?, 'normal', 'active', ?)`
  ).run(crypto.randomUUID(), applicationId, chosen.departmentId, chosen.queueId || null, new Date().toISOString());

  const startedAt = new Date();
  const dueAt = new Date(startedAt.getTime() + (chosen.slaHours || 96) * 3600 * 1000);

  db.prepare(
    `INSERT OR REPLACE INTO sla_tracking
     (id, application_id, service_type, sla_hours, started_at, due_at, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`
  ).run(
    `sla_${applicationId}`,
    applicationId,
    serviceType,
    chosen.slaHours || 96,
    startedAt.toISOString(),
    dueAt.toISOString(),
    new Date().toISOString()
  );

  db.prepare(
    `INSERT INTO workflow_history
     (id, application_id, previous_state, next_state, actor_type, actor_id, comments, created_at)
     VALUES (?, ?, ?, ?, 'system', 'routing-engine', ?, ?)`
  ).run(
    crypto.randomUUID(),
    applicationId,
    WORKFLOW_STATES.SUBMITTED,
    WORKFLOW_STATES.ASSIGNED,
    `Auto-routed to ${chosen.departmentId}`,
    new Date().toISOString()
  );

  return {
    departmentId: chosen.departmentId,
    organizationId: organizationId || null,
    queueId: chosen.queueId || null,
    slaHours: chosen.slaHours || 96,
  };
}
