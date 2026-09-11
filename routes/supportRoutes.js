const router = require('express').Router();
const ctrl = require('../controllers/supportController');
const { requireAuth } = require('../middleware/auth');

router.get('/support/tickets', requireAuth, ctrl.myTickets);
router.post('/support/tickets/create', requireAuth, ctrl.createTicket);
router.get('/support/tickets/:id', requireAuth, ctrl.viewTicket);
router.post('/support/tickets/:id/reply', requireAuth, ctrl.replyAsCustomer);

module.exports = router;