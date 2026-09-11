const router = require('express').Router();
const ctrl = require('../controllers/notificationController');
const { requireAuth } = require('../middleware/auth');

router.get('/notifications', requireAuth, ctrl.list);
router.post('/notifications/:id/read', requireAuth, ctrl.markRead);
router.post('/notifications/mark-all-read', requireAuth, ctrl.markAllRead);
router.post('/notifications/:id/delete', requireAuth, ctrl.remove);

module.exports = router;