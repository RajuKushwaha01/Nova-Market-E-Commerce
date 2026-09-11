const crypto = require('crypto');

exports.attachCsrfToken = (req, res, next) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(24).toString('hex');
  }
  res.locals.csrfToken = req.session.csrfToken;
  next();
};

// Verifies token on state-changing requests.
// Multipart/form-data requests (file uploads) are skipped here — their body isn't parsed yet
// at this point in the middleware chain (multer runs later, at the route level), so
// req.body._csrf would always be undefined. Those routes verify manually after multer
// runs, via verifyCsrfTokenManual below.
exports.verifyCsrfToken = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  const contentType = req.headers['content-type'] || '';
  if (contentType.startsWith('multipart/form-data')) return next();

  const token = req.body._csrf || req.headers['x-csrf-token'];
  if (!token || token !== req.session.csrfToken) {
    return res.status(403).send('Invalid or missing CSRF token.');
  }
  next();
};

// For multipart routes: call this AFTER multer (upload.array/upload.single) has parsed the body,
// so req.body._csrf actually exists by the time we check it.
exports.verifyCsrfTokenManual = (req, res, next) => {
  const token = req.body._csrf || req.headers['x-csrf-token'];
  if (!token || token !== req.session.csrfToken) {
    return res.status(403).send('Invalid or missing CSRF token.');
  }
  next();
};