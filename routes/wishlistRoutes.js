const router = require('express').Router();
const ctrl = require('../controllers/wishlistController');
const { requireAuth } = require('../middleware/auth');

router.get('/wishlist', requireAuth, ctrl.viewWishlist);
router.post('/api/wishlist/toggle', requireAuth, ctrl.toggle);
router.post('/wishlist/:productId/remove', requireAuth, ctrl.remove);
router.post('/wishlist/:productId/move-to-cart', requireAuth, ctrl.moveToCart);

module.exports = router;