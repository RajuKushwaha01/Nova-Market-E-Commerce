const router = require('express').Router();
const ctrl = require('../controllers/sellerController');
const returnCtrl = require('../controllers/returnController');
const { requireAuth } = require('../middleware/auth');
const { requireApprovedSeller } = require('../middleware/sellerAuth');
const upload = require('../config/upload');
const multer = require('multer');
const csvUpload = multer({ storage: multer.memoryStorage() });
const { productRules } = require('../middleware/validators');
const { validationResult } = require('express-validator');
const { verifyCsrfTokenManual } = require('../middleware/csrf');
const { handleMulterError } = require('../middleware/multerErrorHandler');

// Applied PER-ROUTE (spread), never via router.use() — that's what leaked onto /admin, /notifications, etc.
const sellerGuard = [requireAuth, requireApprovedSeller];

router.get('/seller/dashboard', ...sellerGuard, ctrl.dashboard);

router.get('/seller/products', ...sellerGuard, ctrl.listProducts);
router.get('/seller/products/add', ...sellerGuard, ctrl.newProductForm);
router.post(
  '/seller/products/add',
  ...sellerGuard,
  upload.array('images', 6),
  handleMulterError,
  verifyCsrfTokenManual,
  productRules,
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      req.session.productFormError = errors.array()[0].msg;
      return res.redirect('/seller/products/add');
    }

    next();
  },
  ctrl.createProduct
);

router.get('/seller/products/:id/edit', ...sellerGuard, ctrl.editProductForm);
router.post('/seller/products/:id/edit', ...sellerGuard, upload.array('images', 6), handleMulterError, verifyCsrfTokenManual, ctrl.updateProduct);
router.post('/seller/products/:id/delete', ...sellerGuard, ctrl.deleteProduct);
router.post('/seller/products/:id/disable', ...sellerGuard, ctrl.disableProduct);
router.post('/seller/products/:id/duplicate', ...sellerGuard, ctrl.duplicateProduct);

router.get('/seller/inventory', ...sellerGuard, ctrl.inventory);
router.post('/seller/inventory/update', ...sellerGuard, ctrl.updateStock);
router.post('/seller/inventory/bulk-update', ...sellerGuard, ctrl.bulkStockUpdate);

router.get('/seller/bulk-upload', ...sellerGuard, ctrl.bulkUploadForm);
router.post('/seller/bulk-upload', ...sellerGuard, csvUpload.single('csvFile'), ctrl.bulkUploadProcess);

router.get('/seller/orders', ...sellerGuard, ctrl.orders);
router.post('/seller/orders/:orderId/items/:itemId/update-status', ...sellerGuard, ctrl.updateOrderItemStatus);

router.get('/seller/returns', ...sellerGuard, ctrl.returns);
router.post('/seller/orders/:orderId/items/:itemId/return-status', ...sellerGuard, returnCtrl.updateReturnStatus);

router.get('/seller/payments', ...sellerGuard, ctrl.payments);
router.get('/seller/analytics', ...sellerGuard, ctrl.analytics);

router.get('/seller/campaigns', ...sellerGuard, ctrl.campaigns);
router.post('/seller/campaigns/create', ...sellerGuard, ctrl.createCampaign);
router.post('/seller/campaigns/:id/pause', ...sellerGuard, ctrl.pauseCampaign);

module.exports = router;