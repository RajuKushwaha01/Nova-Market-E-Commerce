const router = require('express').Router();
const ctrl = require('../controllers/questionController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.post('/questions/ask', requireAuth, ctrl.ask);
router.post('/questions/:id/answer', requireAuth, requireRole(['seller', 'admin', 'superadmin']), ctrl.answer);
router.post('/questions/:id/helpful', requireAuth, ctrl.markHelpful);
router.post('/questions/:id/report', requireAuth, ctrl.report);

module.exports = router;