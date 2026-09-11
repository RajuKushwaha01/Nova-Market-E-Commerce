const router = require('express').Router();
const ctrl = require('../controllers/addressController');
const { requireAuth } = require('../middleware/auth');
const { addressRules, handleValidation } = require('../middleware/validators');

router.get('/addresses', requireAuth, ctrl.listAddresses);
router.get('/addresses/new', requireAuth, ctrl.newAddressForm);
router.post('/addresses/new', requireAuth, addressRules, handleValidation('address-form', { address: null }), ctrl.createAddress);
router.get('/addresses/:id/edit', requireAuth, ctrl.editAddressForm);
router.post('/addresses/:id/edit', requireAuth, addressRules, handleValidation('address-form', { address: null }), ctrl.updateAddress);
router.post('/addresses/:id/delete', requireAuth, ctrl.deleteAddress);
router.post('/addresses/:id/default', requireAuth, ctrl.setDefault);

module.exports = router;