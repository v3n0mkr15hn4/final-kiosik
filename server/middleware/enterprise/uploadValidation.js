export function uploadValidation(req, res, next) {
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    return res.status(400).json({ success: false, error: 'multipart/form-data is required for file upload.' });
  }

  next();
}
