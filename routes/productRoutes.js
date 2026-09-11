const router = require('express').Router();
const ctrl = require('../controllers/productController');
const { requireAuth } = require('../middleware/auth');

router.get('/', ctrl.home);
router.get('/products', ctrl.list);
router.get('/search', ctrl.search);
router.get('/api/search-suggestions', ctrl.searchSuggestions);
router.post('/search-history/:id/delete', requireAuth, ctrl.deleteSearchHistoryItem);
router.post('/search-history/clear', requireAuth, ctrl.clearSearchHistory);
router.get('/api/check-pincode', ctrl.checkPincode);
router.get('/product/:id', ctrl.details);

module.exports = router;