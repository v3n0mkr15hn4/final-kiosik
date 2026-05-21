import crypto from 'crypto';

export function writeAuditLog(db, entry) {
  db.prepare(`
    INSERT INTO audit_logs (
      id, actor_type, actor_id, event_type, resource_type, resource_id,
      action, metadata_json, ip_address, user_agent, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    crypto.randomUUID(),
    entry.actorType || 'system',
    entry.actorId || null,
    entry.eventType || 'generic',
    entry.resourceType || null,
    entry.resourceId || null,
    entry.action || 'unknown',
    entry.metadata ? JSON.stringify(entry.metadata) : null,
    entry.ipAddress || null,
    entry.userAgent || null,
    new Date().toISOString()
  );
}

export function writeSecurityIncident(db, incident) {
  db.prepare(`
    INSERT INTO security_incidents (
      id, incident_type, severity, actor_id, ip_address,
      details_json, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'open', ?)
  `).run(
    crypto.randomUUID(),
    incident.incidentType,
    incident.severity || 'medium',
    incident.actorId || null,
    incident.ipAddress || null,
    incident.details ? JSON.stringify(incident.details) : null,
    new Date().toISOString()
  );
}
