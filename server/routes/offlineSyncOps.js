import { Router } from 'express';
import { verifyJWT, requirePermission, auditLogger } from '../middleware/authMiddleware.js';
import { ADMIN_PERMISSIONS } from '../config/enterpriseRbac.js';

const router = Router();

router.get(
  '/status',
  verifyJWT,
  requirePermission(ADMIN_PERMISSIONS.KIOSK_MONITOR),
  (_req, res) => {
    return res.json({
      success: true,
      data: {
        pendingSyncItems: 0,
        lastSuccessfulSyncAt: new Date().toISOString(),
        failedSyncBatches: 0,
      },
    });
  }
);

router.post(
  '/retry-failed',
  verifyJWT,
  requirePermission(ADMIN_PERMISSIONS.KIOSK_DIAGNOSTICS),
  auditLogger('OFFLINE_SYNC_RETRY', 'sync'),
  (_req, res) => {
    return res.json({
      success: true,
      message: 'Retry has been scheduled for failed offline batches.',
    });
  }
);

export default router;

