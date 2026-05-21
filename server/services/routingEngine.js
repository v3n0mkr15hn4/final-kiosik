import { randomUUID } from 'crypto';

export function resolveDepartmentRoute(db, serviceType) {
  const mapping = db.prepare(`
    SELECT
      m.id,
      m.service_type AS serviceType,
      m.organization_id AS organizationId,
      m.department_id AS departmentId,
      m.queue_id AS queueId,
      m.sla_hours AS slaHours,
      d.name AS departmentName,
      o.name AS organizationName,
      q.code AS queueCode
    FROM service_department_mapping m
    JOIN departments d ON d.id = m.department_id
    JOIN organizations o ON o.id = m.organization_id
    LEFT JOIN queues q ON q.id = m.queue_id
    WHERE m.service_type = ?
  `).get(serviceType);

  if (mapping) {
    return {
      ...mapping,
      source: 'mapping_table',
    };
  }

  const fallback = db.prepare(`
    SELECT d.id AS departmentId, d.organization_id AS organizationId, d.name AS departmentName, o.name AS organizationName
    FROM departments d
    JOIN organizations o ON o.id = d.organization_id
    ORDER BY d.created_at ASC
    LIMIT 1
  `).get();

  if (!fallback) {
    throw new Error(`No department mapping configured for service type: ${serviceType}`);
  }

  return {
    id: randomUUID(),
    serviceType,
    organizationId: fallback.organizationId,
    departmentId: fallback.departmentId,
    queueId: null,
    queueCode: 'default',
    slaHours: 48,
    departmentName: fallback.departmentName,
    organizationName: fallback.organizationName,
    source: 'fallback_default',
  };
}

export function createSlaDeadline(slaHours) {
  return new Date(Date.now() + Number(slaHours || 24) * 60 * 60 * 1000).toISOString();
}

