// 404 handler — mount this AFTER all routes
exports.notFoundHandler = (req, res, next) => {
  res.status(404).render('404');
};

// Centralized error handler — mount this LAST, after notFoundHandler
exports.errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);
  if (process.env.NODE_ENV !== 'production') console.error(err.stack);

  const status = err.status || 500;

  // Known client errors get a clean message; everything else is masked in production
  const isClientError = status >= 400 && status < 500;
  const safeMessage = isClientError
    ? err.message
    : (process.env.NODE_ENV === 'production' ? 'Something went wrong on our end. Please try again.' : err.message);

  if (req.originalUrl.startsWith('/api/')) {
    return res.status(status).json({ success: false, message: safeMessage });
  }

  res.status(status).render(status === 500 ? '500' : 'error', {
    statusCode: status,
    message: safeMessage,
  });
};

// Wraps async route handlers so thrown errors reach errorHandler instead of crashing the process
exports.asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Helper to throw a typed HTTP error from anywhere: throw new HttpError(404, 'Product not found')
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
exports.HttpError = HttpError;