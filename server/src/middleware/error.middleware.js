export default function errorHandler(err, _req, res, _next) {
  let status = err.status || 500;
  let message = status < 500 ? err.message : 'Internal server error';
  if (err.code === 11000) { status = 409; message = 'Email already registered'; }
  if (err.name === 'ValidationError' || err.name === 'CastError') { status = 400; message = 'Invalid request data'; }
  if (err.type === 'entity.parse.failed') { status = 400; message = 'Invalid JSON'; }
  if (status >= 500) console.error('Request failed:', err.name);
  res.status(status).json({ success: false, message });
}
