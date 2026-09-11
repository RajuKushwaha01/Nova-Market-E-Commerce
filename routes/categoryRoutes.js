const router = require('express').Router();
const ctrl = require('../controllers/categoryController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { requirePermission, attachAdminLocals } = require('../middleware/permissions');
const { ADMIN_TIER_ROLES } = require('../config/permissions');

router.get('/api/categories/:id/subcategories', ctrl.getSubcategories);

// attachAdminLocals is now included here too — this was the missing piece
// causing the sidebar crash on every /admin/categories page load.
const catGuard = [requireAuth, requireRole(ADMIN_TIER_ROLES), attachAdminLocals, requirePermission('categories.manage')];

router.get('/admin/categories', ...catGuard, ctrl.list);
router.post('/admin/categories/create', ...catGuard, ctrl.create);
router.post('/admin/categories/:id/delete', ...catGuard, ctrl.remove);
router.post('/admin/categories/:id/toggle', ...catGuard, ctrl.toggleActive);

module.exports = router;