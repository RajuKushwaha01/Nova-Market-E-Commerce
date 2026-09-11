const router = require('express').Router();
const ctrl = require('../controllers/returnController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.post('/orders/:orderId/items/:itemId/return', requireAuth, ctrl.requestReturn);
router.post('/orders/:orderId/items/:itemId/return-status', requireAuth, requireRole(['seller', 'admin', 'superadmin']), ctrl.updateReturnStatus);

module.exports = router;