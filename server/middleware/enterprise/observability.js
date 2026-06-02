export function securityHeaders(req, res, next) {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=(self)');
  next();
}

export function requestLogger(req, _res, next) {
  req.requestStartAt = Date.now();
  const origin = req.headers.origin || 'direct';
  console.log(`[REQ] ${new Date().toISOString()} ${req.method} ${req.originalUrl} origin=${origin}`);
  next();
}
