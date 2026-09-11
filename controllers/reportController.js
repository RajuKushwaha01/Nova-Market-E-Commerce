const { Parser } = require('json2csv');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Settlement = require('../models/Settlement');

exports.reportsPage = (req, res) => res.render('admin/reports', {});

async function getDateRange(range) {
  const now = new Date();
  const map = { today: 1, week: 7, month: 30, quarter: 90, year: 365 };
  const days = map[range] || 30;
  return new Date(now.getTime() - days * 86400000);
}

exports.exportReport = async (req, res) => {
  const { type, range } = req.query;
  const since = await getDateRange(range);
  let data = [];
  let filename = 'report.csv';

  if (type === 'sales') {
    const orders = await Order.find({ createdAt: { $gte: since } });
    data = orders.map((o) => ({
      OrderNumber: o.orderNumber, Date: o.createdAt.toDateString(), Customer: o.user,
      Total: o.totalAmount, Payment: o.paymentMethod, Status: o.paymentStatus,
    }));
    filename = 'sales-report.csv';
  } else if (type === 'products') {
    const products = await Product.find();
    data = products.map((p) => ({ Name: p.name, Brand: p.brand, Price: p.price, Stock: p.stock, Sold: p.soldCount, Status: p.status }));
    filename = 'products-report.csv';
  } else if (type === 'sellers') {
    const sellers = await User.find({ role: 'seller' });
    data = sellers.map((s) => ({ Name: s.name, Business: s.sellerProfile?.businessName, Status: s.sellerProfile?.status, Email: s.email }));
    filename = 'sellers-report.csv';
  } else if (type === 'users') {
    const users = await User.find({ role: 'customer' });
    data = users.map((u) => ({ Name: u.name, Email: u.email, Mobile: u.mobile, JoinedOn: u.createdAt.toDateString() }));
    filename = 'users-report.csv';
  } else if (type === 'commission') {
    const settlements = await Settlement.find({ createdAt: { $gte: since } });
    data = settlements.map((s) => ({ Seller: s.seller, SaleAmount: s.saleAmount, Commission: s.commissionAmount, NetPayable: s.netPayable, Status: s.status }));
    filename = 'commission-report.csv';
  } else if (type === 'returns') {
    const orders = await Order.find({ 'items.returnInfo.status': { $exists: true } });
    orders.forEach((o) => o.items.forEach((i) => {
      if (i.returnInfo?.status) data.push({ Order: o.orderNumber, Item: i.name, Reason: i.returnInfo.reason, Status: i.returnInfo.status });
    }));
    filename = 'returns-report.csv';
  }

  if (data.length === 0) return res.send('No data available for this report.');

  const parser = new Parser();
  const csv = parser.parse(data);
  res.header('Content-Type', 'text/csv');
  res.attachment(filename);
  res.send(csv);
};

// ---------- ANALYTICS (chart data as JSON, rendered client-side) ----------
exports.analyticsData = async (req, res) => {
  const now = new Date();
  const days = 30;
  const since = new Date(now.getTime() - days * 86400000);

  const orders = await Order.find({ createdAt: { $gte: since } });

  const dailySales = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(now.getTime() - i * 86400000).toISOString().split('T')[0];
    dailySales[d] = 0;
  }
  orders.forEach((o) => {
    const d = o.createdAt.toISOString().split('T')[0];
    if (dailySales[d] !== undefined) dailySales[d] += o.totalAmount;
  });

  const labels = Object.keys(dailySales).reverse();
  const values = labels.map((l) => dailySales[l]);

  const [totalUsers, totalSellers, totalProducts, allOrders] = await Promise.all([
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ role: 'seller', 'sellerProfile.status': 'approved' }),
    Product.countDocuments({ status: 'approved' }),
    Order.find(),
  ]);

  const gmv = allOrders.reduce((s, o) => s + o.totalAmount, 0);
  const avgOrderValue = allOrders.length ? Math.round(gmv / allOrders.length) : 0;

  let cancelled = 0, returned = 0, totalItems = 0;
  allOrders.forEach((o) => o.items.forEach((i) => {
    totalItems++;
    if (i.status === 'CANCELLED') cancelled++;
    if (['RETURNED', 'RETURN_REQUESTED'].includes(i.status)) returned++;
  }));

  res.json({
    labels, values, totalUsers, totalSellers, totalProducts,
    gmv, avgOrderValue,
    cancellationRate: totalItems ? ((cancelled / totalItems) * 100).toFixed(1) : 0,
    returnRate: totalItems ? ((returned / totalItems) * 100).toFixed(1) : 0,
  });
};