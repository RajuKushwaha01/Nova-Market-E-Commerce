const router = require('express').Router();
const ctrl = require('../controllers/compareController');

router.post('/compare/add', ctrl.addToCompare);
router.post('/compare/:productId/remove', ctrl.removeFromCompare);
router.get('/compare', ctrl.viewCompare);

module.exports = router;