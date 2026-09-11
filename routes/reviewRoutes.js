const router = require('express').Router();
const ctrl = require('../controllers/reviewController');
const { requireAuth } = require('../middleware/auth');
const { reviewRules, handleValidation } = require('../middleware/validators');

router.post('/reviews/submit', requireAuth, reviewRules, (req, res, next) => {
  const errors = require('express-validator').validationResult(req);
  if (!errors.isEmpty()) {
    req.session.reviewError = errors.array()[0].msg;
    return res.redirect(`/product/${req.body.productId}#reviews`);
  }
  next();
}, ctrl.submitReview);

router.post('/reviews/:id/helpful', requireAuth, ctrl.markHelpful);
router.post('/reviews/:id/delete', requireAuth, ctrl.deleteReview);

module.exports = router;