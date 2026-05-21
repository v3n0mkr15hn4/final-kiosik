import { randomUUID, createHash } from 'crypto';

export function writeAuditLog(db, payload) {
  const previous = db.prepare('SELECT id, hash_chain FROM audit_logs ORDER BY created_at DESC LIMIT 1').get();
  const previousHash = previous?.hash_chain || '';
  const nextHash = createHash('sha256')
    .update(
      [
        previousHash,
        payload.actorType || '',
        payload.actorId || '',
        payload.action || '',
        payload.entityType || '',
        payload.entityId || '',
        payload.departmentId || '',
        payload.ipAddress || '',
        payload.userAgent || '',
        JSON.stringify(payload.metadata || {}),
        Date.now(),
      ].join('|')
    )
    .digest('hex');

  db.prepare(`
    INSERT INTO audit_logs (
      id, actor_type, actor_id, action, entity_type, entity_id, department_id,
      ip_address, user_agent, metadata_json, hash_chain, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(
    randomUUID(),
    payload.actorType || 'system',
    payload.actorId || null,
    payload.action,
    payload.entityType || 'unknown',
    payload.entityId || null,
    payload.departmentId || null,
    payload.ipAddress || null,
    payload.userAgent || null,
    JSON.stringify(payload.metadata || {}),
    nextHash
  );
}

