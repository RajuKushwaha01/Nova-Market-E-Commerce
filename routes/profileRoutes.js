const router = require('express').Router();
const ctrl = require('../controllers/profileController');
const { requireAuth } = require('../middleware/auth');

router.get('/profile', requireAuth, ctrl.viewProfile);
router.post('/profile/update', requireAuth, ctrl.updateProfile);
router.post('/profile/change-password', requireAuth, ctrl.changePassword);

module.exports = router;