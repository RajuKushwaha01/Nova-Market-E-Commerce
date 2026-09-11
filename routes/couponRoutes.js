const router = require('express').Router();
const ctrl = require('../controllers/couponController');
const { requireAuth } = require('../middleware/auth');

router.post('/api/coupons/apply', requireAuth, ctrl.applyCoupon);

module.exports = router;