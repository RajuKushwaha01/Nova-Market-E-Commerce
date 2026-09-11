const router = require('express').Router();
const ctrl = require('../controllers/authController');
const { authLimiter } = require('../middleware/security');
const { redirectIfLoggedIn } = require('../middleware/auth');
const { registerRules, loginRules, handleValidation } = require('../middleware/validators');

router.get('/register', redirectIfLoggedIn, ctrl.getRegister);
router.post('/register', authLimiter, registerRules, handleValidation('register', { error: null }), ctrl.postRegister);

router.get('/seller/register', redirectIfLoggedIn, ctrl.getSellerRegister);
router.post('/seller/register', authLimiter, registerRules, handleValidation('seller-register', { error: null }), ctrl.postSellerRegister);
router.get('/seller/pending', (req, res) => res.render('seller-pending'));

router.get('/login', redirectIfLoggedIn, ctrl.getLogin);
// Updated line below to include portal: 'customer' in the validation fallback
router.post('/login', authLimiter, loginRules, handleValidation('login', { error: null, portal: 'customer' }), ctrl.postLogin);
router.get('/logout', ctrl.logout);

router.get('/forgot-password', ctrl.getForgotPassword);
router.post('/forgot-password', authLimiter, ctrl.postForgotPassword);
router.get('/reset-password/:token', ctrl.getResetPassword);
router.post('/reset-password/:token', authLimiter, ctrl.postResetPassword);

module.exports = router;