const router = require('express').Router();
const ctrl = require('../controllers/cartController');
const orderCtrl = require('../controllers/orderController');
const { requireAuth } = require('../middleware/auth');

router.get('/cart', requireAuth, ctrl.viewCart);
router.post('/cart/add', requireAuth, ctrl.addToCart);
router.post('/cart/update', requireAuth, ctrl.updateItem);
router.post('/cart/:cartItemId/remove', requireAuth, ctrl.removeItem);
router.post('/cart/:cartItemId/save-for-later', requireAuth, ctrl.saveForLater);
router.post('/cart/:cartItemId/move-to-cart', requireAuth, ctrl.moveToCart);

// Reserve stock, THEN show checkout page (chained middleware)
router.get('/checkout', requireAuth, ctrl.reserveStockForCheckout, orderCtrl.checkoutPage);

module.exports = router;