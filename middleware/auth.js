exports.attachUser = (req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
};

exports.requireAuth = (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  next();
};

// Accepts one role string OR an array of roles
exports.requireRole = (roles) => (req, res, next) => {
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!req.session.user || !allowed.includes(req.session.user.role)) {
    return res.status(403).render('403');
  }
  next();
};

// Sends an already-logged-in user straight to THEIR dashboard
// instead of a generic redirect to '/'
exports.redirectIfLoggedIn = (req, res, next) => {
  if (req.session.user) {
    const role = req.session.user.role;
    if (role === 'seller') return res.redirect('/seller/dashboard');
    if (role === 'admin' || role === 'superadmin') return res.redirect('/admin/dashboard');
    return res.redirect('/');
  }
  next();
};