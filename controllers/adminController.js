const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const Campaign = require('../models/Campaign');
const AuditLog = require('../models/AuditLog');
const { logAction } = require('../middleware/audit');
const { notify } = require('./notificationController');
const { sendMail } = require('../config/mailer');

// ---------- DASHBOARD ----------
exports.dashboard = async (req, res) => {
  const [totalUsers, totalSellers, totalProducts, orders, pendingSellers, pendingProducts] = await Promise.all([
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ role: 'seller', 'sellerProfile.status': 'approved' }),
    Product.countDocuments({ status: 'approved' }),
    Order.find(),
    User.countDocuments({ role: 'seller', 'sellerProfile.status': 'pending' }),
    Product.countDocuments({ status: 'pending' }),
  ]);

  const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
  let pendingOrders = 0, returnRequests = 0, refunds = 0;
  orders.forEach((o) => o.items.forEach((i) => {
    if (['PLACED', 'CONFIRMED'].includes(i.status)) pendingOrders++;
    if (i.status === 'RETURN_REQUESTED') returnRequests++;
    if (i.status === 'REFUNDED') refunds++;
  }));

  res.render('admin/dashboard', {
    totalUsers, totalSellers, totalProducts, totalOrders: orders.length, totalRevenue,
    pendingOrders, pendingSellers, returnRequests, refunds, pendingProducts,
  });
};

// ---------- USER MANAGEMENT ----------
exports.listUsers = async (req, res) => {
  const { q, role } = req.query;
  const filter = {};
  if (q) filter.$or = [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }];
  if (role) filter.role = role;
  const users = await User.find(filter).sort({ createdAt: -1 });
  res.render('admin/users', { users, query: req.query });
};

exports.toggleBlockUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  const old = user.isBlocked;
  user.isBlocked = !user.isBlocked;
  await user.save();
  await logAction(req, { action: user.isBlocked ? 'Blocked user' : 'Unblocked user', entity: 'User', entityId: user._id, oldValue: old, newValue: user.isBlocked });
  res.redirect('/admin/users');
};

exports.changeUserRole = async (req, res) => {
  const { role } = req.body;
  const user = await User.findById(req.params.id);
  const old = user.role;
  user.role = role;
  await user.save();
  await logAction(req, { action: 'Changed user role', entity: 'User', entityId: user._id, oldValue: old, newValue: role });
  res.redirect('/admin/users');
};

exports.deleteUser = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  await logAction(req, { action: 'Deleted user', entity: 'User', entityId: req.params.id });
  res.redirect('/admin/users');
};

// ---------- SELLER MANAGEMENT ----------
exports.listSellers = async (req, res) => {
  const { status } = req.query;
  const filter = { role: 'seller' };
  if (status) filter['sellerProfile.status'] = status;
  const sellers = await User.find(filter).sort({ createdAt: -1 });

  const sellerStats = await Promise.all(sellers.map(async (s) => {
    const productCount = await Product.countDocuments({ seller: s._id });
    return { seller: s, productCount };
  }));

  res.render('admin/sellers', { sellerStats, activeStatus: status || '' });
};

exports.updateSellerStatus = async (req, res) => {
  const { status } = req.body;
  const seller = await User.findById(req.params.id);
  const old = seller.sellerProfile.status;
  seller.sellerProfile.status = status;
  await seller.save();

  await logAction(req, { action: `Seller ${status}`, entity: 'User', entityId: seller._id, oldValue: old, newValue: status });
  await notify(seller._id, 'SUPPORT', 'Seller Account Update', `Your seller account status changed to: ${status}.`, '/seller/dashboard');
  await sendMail({ to: seller.email, subject: 'NOVA MARKET Seller Account Update', html: `<p>Your seller account status is now: <b>${status}</b>.</p>` });

  res.redirect('/admin/sellers');
};

// ---------- PRODUCT ADMINISTRATION ----------
exports.listProducts = async (req, res) => {
  const { status, q } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (q) filter.name = new RegExp(q, 'i');
  const products = await Product.find(filter).populate('seller', 'name').populate('category', 'name').sort({ createdAt: -1 });
  res.render('admin/products', { products, query: req.query });
};

exports.updateProductStatus = async (req, res) => {
  const { status } = req.body;
  const product = await Product.findById(req.params.id);
  const old = product.status;
  product.status = status;
  await product.save();
  await logAction(req, { action: `Product ${status}`, entity: 'Product', entityId: product._id, oldValue: old, newValue: status });
  res.redirect('/admin/products');
};

exports.toggleFeatured = async (req, res) => {
  const product = await Product.findById(req.params.id);
  product.isFeatured = !product.isFeatured;
  await product.save();
  res.redirect('/admin/products');
};

exports.adminUpdatePrice = async (req, res) => {
  const { price, stock } = req.body;
  const product = await Product.findById(req.params.id);
  const old = { price: product.price, stock: product.stock };
  product.price = Number(price);
  product.stock = Number(stock);
  await product.save();
  await logAction(req, { action: 'Admin edited price/stock', entity: 'Product', entityId: product._id, oldValue: old, newValue: { price, stock } });
  res.redirect('/admin/products');
};

exports.deleteProduct = async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  await logAction(req, { action: 'Deleted product', entity: 'Product', entityId: req.params.id });
  res.redirect('/admin/products');
};

// ---------- CATEGORY MANAGEMENT (reuses categoryController from Part 2 — this adds reorder) ----------
exports.reorderCategory = async (req, res) => {
  const { order } = req.body;
  await Category.findByIdAndUpdate(req.params.id, { order: Number(order) });
  res.redirect('/admin/categories');
};

// ---------- ORDER ADMINISTRATION ----------
exports.listOrders = async (req, res) => {
  const { q, status } = req.query;
  let orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(200);

  if (q) orders = orders.filter((o) => o.orderNumber.includes(q.toUpperCase()) || o.user?.email?.includes(q));
  if (status) orders = orders.filter((o) => o.items.some((i) => i.status === status));

  res.render('admin/orders', { orders, query: req.query });
};

// ---------- CAMPAIGN APPROVAL ----------
exports.approveCampaign = async (req, res) => {
  const { status } = req.body;
  await Campaign.findByIdAndUpdate(req.params.id, { status });
  res.redirect('/admin/products');
};

// ---------- AUDIT LOGS ----------
exports.auditLogs = async (req, res) => {
  const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(200);
  res.render('admin/audit-logs', { logs });
};