const router = require('express').Router();
const ctrl = require('../controllers/orderController');
const rewardCtrl = require('../controllers/rewardController');
const { requireAuth } = require('../middleware/auth');

router.post('/checkout/place-cod', requireAuth, ctrl.placeCodOrder);
router.post('/api/razorpay/create-order', requireAuth, ctrl.createRazorpayOrder);
router.post('/api/razorpay/verify', requireAuth, ctrl.verifyPayment);

router.get('/order-success/:id', requireAuth, ctrl.orderSuccess);
router.get('/orders', requireAuth, ctrl.myOrders);
router.get('/orders/:id', requireAuth, ctrl.orderDetails);
router.get('/orders/:id/invoice', requireAuth, ctrl.invoice);
router.post('/orders/:orderId/items/:itemId/cancel', requireAuth, ctrl.cancelItem);

// Reward route
router.get('/rewards', requireAuth, rewardCtrl.viewRewards);

module.exports = router;