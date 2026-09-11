const { hasPermission } = require('../config/permissions');

// Use AFTER requireAuth + requireRole(ADMIN_TIER_ROLES).
exports.requirePermission = (permission) => (req, res, next) => {
  const role = req.session.user?.role;
  if (!role || !hasPermission(role, permission)) {
    return res.status(403).render('403');
  }
  next();
};

// Makes res.locals.can()/adminRole available to EVERY admin view, regardless of
// which routes file handles the request. Previously this was only attached inside
// adminRoutes.js, so any admin page served via a different router (like
// categoryRoutes.js for /admin/categories) crashed with "adminRole is not defined"
// because the sidebar partial references it unconditionally.
exports.attachAdminLocals = (req, res, next) => {
  const role = req.session.user.role;
  res.locals.can = (perm) => hasPermission(role, perm);
  res.locals.adminRole = role;
  next();
};