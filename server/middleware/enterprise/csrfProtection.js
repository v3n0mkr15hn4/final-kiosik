export function csrfProtection(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const token = req.headers['x-csrf-token'];
  if (!token || String(token).length < 16) {
    return res.status(403).json({ success: false, error: 'Missing or invalid CSRF token.' });
  }

  return next();
}
