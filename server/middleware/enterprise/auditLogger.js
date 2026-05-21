import { getRequestContext } from '../../enterprise/services/requestContext.js';
import { writeAuditLog } from '../../enterprise/services/auditService.js';

export function auditLogger(eventType, action, resourceType) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      try {
        const db = req.app.locals.db;
        const context = getRequestContext(req);
        writeAuditLog(db, {
          actorType: req.auth?.actorType || (req.user ? 'citizen' : 'anonymous'),
          actorId: req.auth?.sub || req.user?.uid || null,
          eventType,
          action,
          resourceType,
          resourceId: req.params?.id || req.params?.requestId || req.params?.complaintId || null,
          metadata: {
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            success: body?.success !== false,
          },
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });
      } catch (error) {
        console.error('[AUDIT_LOGGER] Failed:', error.message);
      }
      return originalJson(body);
    };

    next();
  };
}
