const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const Commission = require('../models/Commission');
const Settlement = require('../models/Settlement');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const csv = require('csv-parser');
const { Readable } = require('stream');
const { notify } = require('./notificationController');

// ---------------- DASHBOARD ----------------
exports.dashboard = async (req, res) => {
  const sellerId = req.session.user.id;

  const [products, orders, settlements] = await Promise.all([
    Product.find({ seller: sellerId }),
    Order.find({ 'items.seller': sellerId }),
    Settlement.find({ seller: sellerId }),
  ]);

  const sellerItems = [];
  orders.forEach((o) => o.items.forEach((i) => { if (i.seller.toString() === sellerId) sellerItems.push(i); }));

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todaySales = sellerItems.filter((i) => i.status !== 'CANCELLED' && new Date(i.statusHistory[0]?.date) >= today)
    .reduce((s, i) => s + i.price * i.quantity, 0);

  const totalSales = sellerItems.filter((i) => i.status !== 'CANCELLED')
    .reduce((s, i) => s + i.price * i.quantity, 0);

  const availableBalance = settlements.filter((s) => s.status === 'AVAILABLE').reduce((s, x) => s + x.netPayable, 0);
  const pendingPayments = settlements.filter((s) => s.status === 'PENDING').reduce((s, x) => s + x.netPayable, 0);
  const paidAmount = settlements.filter((s) => s.status === 'PAID').reduce((s, x) => s + x.netPayable, 0);

  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
  const outOfStock = products.filter((p) => p.stock === 0).length;
  const pendingOrders = sellerItems.filter((i) => ['PLACED', 'CONFIRMED'].includes(i.status)).length;
  const returns = sellerItems.filter((i) => i.status === 'RETURN_REQUESTED').length;

  res.render('seller/dashboard', {
    todaySales, totalSales, orderCount: sellerItems.length, productCount: products.length,
    lowStock, outOfStock, pendingOrders, returns, availableBalance, pendingPayments, paidAmount,
  });
};

// ---------------- PRODUCT MANAGEMENT ----------------
exports.listProducts = async (req, res) => {
  const products = await Product.find({ seller: req.session.user.id }).populate('category', 'name').sort({ createdAt: -1 });
  const successMessage = req.session.productSuccessMessage;
  delete req.session.productSuccessMessage;
  res.render('seller/products', { products, successMessage });
};

exports.newProductForm = async (req, res) => {
  const categories = await Category.find({ isActive: true });
  const productFormError = req.session.productFormError;
  delete req.session.productFormError;
  res.render('seller/product-form', { product: null, categories, productFormError });
};

exports.editProductForm = async (req, res) => {
  const [product, categories] = await Promise.all([
    Product.findOne({ _id: req.params.id, seller: req.session.user.id }),
    Category.find({ isActive: true }),
  ]);
  if (!product) return res.redirect('/seller/products');
  const productFormError = req.session.productFormError;
  delete req.session.productFormError;
  res.render('seller/product-form', { product, categories, productFormError });
};

exports.createProduct = async (req, res) => {
  try {
    console.log('\n========== PRODUCT IMAGE DEBUG ==========');

    console.log('REQ.FILES:', req.files);
    console.log('IMAGE COUNT:', req.files ? req.files.length : 0);

    const {
      name,
      brand,
      category,
      description,
      highlights,
      mrp,
      price,
      stock,
      sku,
      warranty,
      returnPolicy,
      specKeys,
      specValues,
      variantData
    } = req.body;

    // Convert uploaded files into database paths
    const images = (req.files || []).map((file) => {
      console.log('UPLOADED FILE:', {
        originalname: file.originalname,
        filename: file.filename,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size
      });

      return '/uploads/' + file.filename;
    });

    console.log('IMAGE PATHS TO SAVE:', images);

    // Specifications
    const specifications = {};

    if (specKeys) {
      const keys = Array.isArray(specKeys) ? specKeys : [specKeys];
      const vals = Array.isArray(specValues) ? specValues : [specValues];

      keys.forEach((key, index) => {
        if (key && key.trim()) {
          specifications[key.trim()] = vals[index] || '';
        }
      });
    }

    // Variants
    let variants = [];

    if (variantData) {
      try {
        variants = JSON.parse(variantData);
      } catch (error) {
        console.log('Variant JSON error:', error.message);
        variants = [];
      }
    }

    const productData = {
      name,
      brand,
      category,
      description,

      highlights: highlights
        ? highlights.split('\n').filter(Boolean)
        : [],

      specifications,

      images,

      mrp: Number(mrp),
      price: Number(price),
      stock: Number(stock),

      sku: sku || undefined,

      warranty,
      returnPolicy,

      variants,

      seller: req.session.user.id,

      // Keep approved for your current testing
      status: 'approved'
    };

    console.log('PRODUCT DATA BEFORE CREATE:');
    console.log(productData);

    const product = await Product.create(productData);

    console.log('PRODUCT CREATED:', product._id);
    console.log('PRODUCT IMAGES SAVED:', product.images);
    console.log('========================================\n');

    req.session.productSuccessMessage =
      'Product created successfully!';

    res.redirect('/seller/products');

  } catch (err) {
    console.error('\n❌ PRODUCT CREATE FAILED');
    console.error(err);
    console.error('========================================\n');

    req.session.productFormError = err.message;

    res.redirect('/seller/products/add');
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { name, brand, category, description, highlights, mrp, price, stock,
      warranty, returnPolicy, specKeys, specValues } = req.body;

    const product = await Product.findOne({ _id: req.params.id, seller: req.session.user.id });
    if (!product) return res.redirect('/seller/products');

    const specifications = {};
    if (specKeys) {
      const keys = Array.isArray(specKeys) ? specKeys : [specKeys];
      const vals = Array.isArray(specValues) ? specValues : [specValues];
      keys.forEach((k, i) => { if (k) specifications[k] = vals[i]; });
    }

    if (req.files && req.files.length > 0) {
      product.images.push(...req.files.map((f) => '/uploads/' + f.filename));
    }

    product.name = name; product.brand = brand; product.category = category;
    product.description = description;
    product.highlights = highlights ? highlights.split('\n').filter(Boolean) : [];
    product.specifications = specifications;
    product.mrp = Number(mrp); product.price = Number(price); product.stock = Number(stock);
    product.warranty = warranty; product.returnPolicy = returnPolicy;
    product.status = 'pending'; // re-review after edit

    await product.save();
    req.session.productSuccessMessage = 'Product updated successfully! Changes are pending admin re-approval before going live.';
    res.redirect('/seller/products');
  } catch (err) {
    console.error(err);
    res.redirect('/seller/products');
  }
};

exports.deleteProduct = async (req, res) => {
  await Product.findOneAndDelete({ _id: req.params.id, seller: req.session.user.id });
  res.redirect('/seller/products');
};

exports.disableProduct = async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, seller: req.session.user.id });
  product.status = product.status === 'disabled' ? 'approved' : 'disabled';
  await product.save();
  res.redirect('/seller/products');
};

exports.duplicateProduct = async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, seller: req.session.user.id }).lean();
  if (!product) return res.redirect('/seller/products');
  delete product._id;
  product.name = product.name + ' (Copy)';
  product.status = 'pending';
  product.sku = undefined;
  await Product.create(product);
  res.redirect('/seller/products');
};

// ---------------- INVENTORY ----------------
exports.inventory = async (req, res) => {
  const products = await Product.find({ seller: req.session.user.id }).select('name sku stock variants images');
  res.render('seller/inventory', { products });
};

exports.updateStock = async (req, res) => {
  const { productId, variantId, stock } = req.body;
  const product = await Product.findOne({ _id: productId, seller: req.session.user.id });
  if (!product) return res.redirect('/seller/inventory');

  if (variantId) {
    const v = product.variants.id(variantId);
    if (v) v.stock = Number(stock);
  } else {
    product.stock = Number(stock);
  }
  await product.save();
  res.redirect('/seller/inventory');
};

exports.bulkStockUpdate = async (req, res) => {
  const { productIds, stocks } = req.body;
  const ids = Array.isArray(productIds) ? productIds : [productIds];
  const vals = Array.isArray(stocks) ? stocks : [stocks];

  await Promise.all(ids.map((id, i) =>
    Product.updateOne({ _id: id, seller: req.session.user.id }, { stock: Number(vals[i]) })
  ));
  res.redirect('/seller/inventory');
};

// ---------------- BULK CSV UPLOAD ----------------
exports.bulkUploadForm = (req, res) => res.render('seller/bulk-upload', { results: null, errors: null });

exports.bulkUploadProcess = async (req, res) => {
  if (!req.file) return res.render('seller/bulk-upload', { results: null, errors: ['No file uploaded.'] });

  const rows = [];
  const errors = [];

  await new Promise((resolve) => {
    Readable.from(req.file.buffer.toString())
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', resolve);
  });

  const categories = await Category.find();
  const catMap = new Map(categories.map((c) => [c.slug, c._id]));
  const existingSkus = new Set((await Product.find({ seller: req.session.user.id }).select('sku')).map((p) => p.sku));

  const validProducts = [];
  rows.forEach((row, idx) => {
    const line = idx + 2; // account for header row
    if (!row.name) return errors.push(`Row ${line}: missing name`);
    if (!row.price || isNaN(Number(row.price))) return errors.push(`Row ${line}: invalid price`);
    if (!row.category || !catMap.has(row.category)) return errors.push(`Row ${line}: invalid category slug "${row.category}"`);
    if (row.sku && existingSkus.has(row.sku)) return errors.push(`Row ${line}: duplicate SKU "${row.sku}"`);
    if (!row.stock || isNaN(Number(row.stock))) return errors.push(`Row ${line}: missing/invalid stock`);

    validProducts.push({
      name: row.name, brand: row.brand || 'Generic',
      category: catMap.get(row.category),
      description: row.description || row.name,
      mrp: Number(row.mrp || row.price), price: Number(row.price), stock: Number(row.stock),
      sku: row.sku || undefined,
      images: row.images ? row.images.split('|') : [],
      seller: req.session.user.id, status: 'pending',
    });
    if (row.sku) existingSkus.add(row.sku);
  });

  if (validProducts.length > 0) await Product.insertMany(validProducts);

  res.render('seller/bulk-upload', { results: { imported: validProducts.length, total: rows.length }, errors });
};

// ---------------- ORDER MANAGEMENT ----------------
exports.orders = async (req, res) => {
  const { status } = req.query;
  const orders = await Order.find({ 'items.seller': req.session.user.id }).sort({ createdAt: -1 });

  const rows = [];
  orders.forEach((o) => {
    o.items.forEach((item) => {
      if (item.seller.toString() === req.session.user.id) {
        if (!status || item.status === status) {
          rows.push({ order: o, item });
        }
      }
    });
  });

  res.render('seller/orders', { rows, activeStatus: status || '' });
};

exports.updateOrderItemStatus = async (req, res) => {
  const { orderId, itemId } = req.params;
  const { status, trackingId, courier } = req.body;

  const order = await Order.findById(orderId);
  const item = order.items.id(itemId);
  if (!item || item.seller.toString() !== req.session.user.id) return res.redirect('/seller/orders');

  item.status = status;
  if (trackingId) item.trackingId = trackingId;
  if (courier) item.courier = courier;
  item.statusHistory.push({ status });

  if (status === 'DELIVERED') {
    item.status = 'DELIVERED';
    await createSettlementForItem(order, item);
    await Product.updateOne({ _id: item.product }, { $inc: { soldCount: item.quantity } });
    await require('./rewardController').earnPoints(order.user, item.price * item.quantity, order._id);
  }

  await order.save();

  const statusMessages = {
    CONFIRMED: 'Your order has been confirmed.',
    PACKED: 'Your order has been packed.',
    SHIPPED: 'Your order has been shipped.',
    OUT_FOR_DELIVERY: 'Your order is out for delivery.',
    DELIVERED: 'Your order has been delivered.',
  };

  if (statusMessages[status]) {
    await notify(
      order.user,
      status === 'DELIVERED' ? 'DELIVERED' : status === 'SHIPPED' ? 'SHIPPED' : 'OUT_FOR_DELIVERY',
      'Order Update',
      statusMessages[status],
      `/orders/${order._id}`
    );
  }

  res.redirect('/seller/orders');
};

async function createSettlementForItem(order, item) {
  const product = await Product.findById(item.product);
  const commissionRule = await Commission.findOne({ category: product?.category });

  const saleAmount = item.price * item.quantity;
  const commissionPercent = commissionRule?.commissionPercent ?? 10;
  const commissionAmount = Math.round(saleAmount * (commissionPercent / 100));
  const fixedFee = commissionRule?.fixedFee ?? 0;
  const shippingFee = commissionRule?.shippingFee ?? 0;
  const paymentFee = commissionRule?.paymentFee ?? 0;
  const netPayable = saleAmount - commissionAmount - fixedFee - shippingFee - paymentFee;

  await Settlement.create({
    seller: item.seller, order: order._id, itemId: item._id,
    saleAmount, commissionPercent, commissionAmount, fixedFee, shippingFee, paymentFee,
    netPayable: Math.max(0, netPayable), status: 'PENDING',
  });
}

// ---------------- SELLER RETURNS ----------------
exports.returns = async (req, res) => {
  const orders = await Order.find({ 'items.seller': req.session.user.id, 'items.returnInfo.status': { $exists: true } });
  const rows = [];
  orders.forEach((o) => {
    o.items.forEach((item) => {
      if (item.seller.toString() === req.session.user.id && item.returnInfo && item.returnInfo.status) {
        rows.push({ order: o, item });
      }
    });
  });
  res.render('seller/returns', { rows });
};

// ---------------- PAYMENTS / SETTLEMENTS ----------------
exports.payments = async (req, res) => {
  const settlements = await Settlement.find({ seller: req.session.user.id }).populate('order', 'orderNumber').sort({ createdAt: -1 });

  const totals = settlements.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + s.netPayable;
    return acc;
  }, {});

  res.render('seller/payments', { settlements, totals });
};

// Simulate "available after 7 days" logic — normally a cron job
exports.releaseEligibleSettlements = async () => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
  await Settlement.updateMany(
    { status: 'PENDING', createdAt: { $lte: sevenDaysAgo } },
    { status: 'AVAILABLE' }
  );
};

// ---------------- ANALYTICS ----------------
exports.analytics = async (req, res) => {
  const sellerId = req.session.user.id;
  const products = await Product.find({ seller: sellerId });
  const orders = await Order.find({ 'items.seller': sellerId });

  const sellerItems = [];
  orders.forEach((o) => o.items.forEach((i) => { if (i.seller.toString() === sellerId) sellerItems.push(i); }));

  const delivered = sellerItems.filter((i) => i.status === 'DELIVERED');
  const cancelled = sellerItems.filter((i) => i.status === 'CANCELLED');
  const returned = sellerItems.filter((i) => ['RETURNED', 'RETURN_REQUESTED'].includes(i.status));

  const revenue = delivered.reduce((s, i) => s + i.price * i.quantity, 0);
  const avgOrderValue = delivered.length ? Math.round(revenue / delivered.length) : 0;

  const totalViews = products.reduce((s, p) => s + (p.viewCount || 0), 0);
  const conversionRate = totalViews > 0 ? ((delivered.length / totalViews) * 100).toFixed(2) : 0;

  const topProducts = [...products].sort((a, b) => b.soldCount - a.soldCount).slice(0, 5);

  res.render('seller/analytics', {
    revenue, totalOrders: sellerItems.length, avgOrderValue, topProducts,
    totalViews, conversionRate,
    returnRate: sellerItems.length ? ((returned.length / sellerItems.length) * 100).toFixed(1) : 0,
    cancellationRate: sellerItems.length ? ((cancelled.length / sellerItems.length) * 100).toFixed(1) : 0,
  });
};

// ---------------- ADVERTISING / CAMPAIGNS ----------------
exports.campaigns = async (req, res) => {
  const campaigns = await Campaign.find({ seller: req.session.user.id }).populate('product', 'name images').sort({ createdAt: -1 });
  const products = await Product.find({ seller: req.session.user.id, status: 'approved' });
  res.render('seller/campaigns', { campaigns, products });
};

exports.createCampaign = async (req, res) => {
  const { productId, type, budget, startDate, endDate } = req.body;
  await Campaign.create({
    seller: req.session.user.id, product: productId, type, budget: Number(budget),
    startDate, endDate, status: 'pending', // requires admin approval
  });
  res.redirect('/seller/campaigns');
};

exports.pauseCampaign = async (req, res) => {
  const campaign = await Campaign.findOne({ _id: req.params.id, seller: req.session.user.id });
  if (campaign) {
    campaign.status = campaign.status === 'paused' ? 'active' : 'paused';
    await campaign.save();
  }
  res.redirect('/seller/campaigns');
};