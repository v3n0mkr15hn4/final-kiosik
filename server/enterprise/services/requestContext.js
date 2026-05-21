export function getRequestContext(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  const ip = typeof forwardedFor === 'string'
    ? forwardedFor.split(',')[0].trim()
    : req.ip || req.socket?.remoteAddress || 'unknown';

  return {
    ipAddress: ip,
    userAgent: req.headers['user-agent'] || 'unknown',
    deviceFingerprint: req.headers['x-device-fingerprint'] || 'unknown-device',
  };
}
