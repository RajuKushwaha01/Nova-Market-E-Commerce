const router = require('express').Router();
const adminCtrl = require('../controllers/adminController');
const couponCtrl = require('../controllers/couponController');
const offerCtrl = require('../controllers/offerController');
const supportCtrl = require('../controllers/supportController');
const reportCtrl = require('../controllers/reportController');
const brandCtrl = require('../controllers/brandController');
const notifCtrl = require('../controllers/notificationController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { requirePermission, attachAdminLocals } = require('../middleware/permissions');
const { ADMIN_TIER_ROLES } = require('../config/permissions');

const adminGuard = [requireAuth, requireRole(ADMIN_TIER_ROLES), attachAdminLocals];

router.get('/admin/dashboard', ...adminGuard, adminCtrl.dashboard);

router.get('/admin/users', ...adminGuard, requirePermission('users.manage'), adminCtrl.listUsers);
router.post('/admin/users/:id/toggle-block', ...adminGuard, requirePermission('users.manage'), adminCtrl.toggleBlockUser);
router.post('/admin/users/:id/role', ...adminGuard, requirePermission('users.manage'), adminCtrl.changeUserRole);
router.post('/admin/users/:id/delete', ...adminGuard, requirePermission('users.manage'), adminCtrl.deleteUser);

router.get('/admin/sellers', ...adminGuard, requirePermission('sellers.manage'), adminCtrl.listSellers);
router.post('/admin/sellers/:id/status', ...adminGuard, requirePermission('sellers.manage'), adminCtrl.updateSellerStatus);

router.get('/admin/products', ...adminGuard, requirePermission('products.manage'), adminCtrl.listProducts);
router.post('/admin/products/:id/status', ...adminGuard, requirePermission('products.manage'), adminCtrl.updateProductStatus);
router.post('/admin/products/:id/featured', ...adminGuard, requirePermission('products.manage'), adminCtrl.toggleFeatured);
router.post('/admin/products/:id/price', ...adminGuard, requirePermission('products.manage'), adminCtrl.adminUpdatePrice);
router.post('/admin/products/:id/delete', ...adminGuard, requirePermission('products.manage'), adminCtrl.deleteProduct);
router.post('/admin/campaigns/:id/status', ...adminGuard, requirePermission('campaigns.approve'), adminCtrl.approveCampaign);

router.get('/admin/brands', ...adminGuard, requirePermission('brands.manage'), brandCtrl.list);
router.post('/admin/brands/create', ...adminGuard, requirePermission('brands.manage'), brandCtrl.create);
router.post('/admin/brands/:id/toggle', ...adminGuard, requirePermission('brands.manage'), brandCtrl.toggle);
router.post('/admin/brands/:id/delete', ...adminGuard, requirePermission('brands.manage'), brandCtrl.remove);

router.post('/admin/categories/:id/reorder', ...adminGuard, requirePermission('categories.manage'), adminCtrl.reorderCategory);

router.get('/admin/orders', ...adminGuard, requirePermission('orders.view'), adminCtrl.listOrders);

router.get('/admin/coupons', ...adminGuard, requirePermission('coupons.manage'), couponCtrl.list);
router.post('/admin/coupons/create', ...adminGuard, requirePermission('coupons.manage'), couponCtrl.create);
router.post('/admin/coupons/:id/toggle', ...adminGuard, requirePermission('coupons.manage'), couponCtrl.toggle);
router.post('/admin/coupons/:id/delete', ...adminGuard, requirePermission('coupons.manage'), couponCtrl.remove);

router.get('/admin/flash-sales', ...adminGuard, requirePermission('offers.manage'), offerCtrl.listFlashSales);
router.post('/admin/flash-sales/create', ...adminGuard, requirePermission('offers.manage'), offerCtrl.createFlashSale);
router.post('/admin/flash-sales/:id/toggle', ...adminGuard, requirePermission('offers.manage'), offerCtrl.toggleFlashSale);

router.get('/admin/bank-offers', ...adminGuard, requirePermission('offers.manage'), offerCtrl.listBankOffers);
router.post('/admin/bank-offers/create', ...adminGuard, requirePermission('offers.manage'), offerCtrl.createBankOffer);
router.post('/admin/bank-offers/:id/toggle', ...adminGuard, requirePermission('offers.manage'), offerCtrl.toggleBankOffer);

router.get('/admin/support', ...adminGuard, requirePermission('support.manage'), supportCtrl.adminList);
router.get('/admin/support/:id', ...adminGuard, requirePermission('support.manage'), supportCtrl.adminViewTicket);
router.post('/admin/support/:id/reply', ...adminGuard, requirePermission('support.manage'), supportCtrl.adminReply);

router.get('/admin/notifications-broadcast', ...adminGuard, requirePermission('notifications.send'), notifCtrl.broadcastForm);
router.post('/admin/notifications-broadcast', ...adminGuard, requirePermission('notifications.send'), notifCtrl.broadcast);

router.get('/admin/reports', ...adminGuard, requirePermission('reports.view'), reportCtrl.reportsPage);
router.get('/admin/reports/export', ...adminGuard, requirePermission('reports.view'), reportCtrl.exportReport);
router.get('/api/admin/analytics-data', ...adminGuard, requirePermission('analytics.view'), reportCtrl.analyticsData);
router.get('/admin/analytics', ...adminGuard, requirePermission('analytics.view'), (req, res) => res.render('admin/analytics'));

router.get('/admin/audit-logs', ...adminGuard, requirePermission('auditlogs.view'), adminCtrl.auditLogs);

module.exports = router;