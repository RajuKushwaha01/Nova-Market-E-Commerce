const Cart = require('../models/Cart');
const Address = require('../models/Address');
const Order = require('../models/Order');
const Product = require('../models/Product');
const razorpay = require('../config/razorpay');
const crypto = require('crypto');
const cartController = require('./cartController');
const { notify } = require('./notificationController');
const { sendMail } = require('../config/mailer');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateAndCompute, markCouponUsed } = require('./couponController');

const COD_LIMIT = 20000;
const COD_FEE = 25;

function computeSummary(cart) {
  let subtotal = 0, totalMrp = 0;
  const lineItems = [];

  cart.items.filter((i) => !i.savedForLater && i.product).forEach((item) => {
    const info = cartController.resolveLineInfo(item.product, item.variantId);
    if (!info) return;
    const lineTotal = info.price * item.quantity;
    subtotal += lineTotal;
    totalMrp += info.mrp * item.quantity;
    lineItems.push({
      product: item.product, variantId: item.variantId, quantity: item.quantity,
      price: info.price, mrp: info.mrp, image: info.image, label: info.label,
    });
  });

  const productDiscount = totalMrp - subtotal;
  const deliveryFee = subtotal > 499 || subtotal === 0 ? 0 : 40;
  return { lineItems, subtotal, totalMrp, productDiscount, deliveryFee };
}

exports.checkoutPage = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.session.user.id }).populate({
    path: 'items.product', populate: { path: 'seller', select: 'name sellerProfile.businessName' },
  });
  if (!cart || cart.items.filter((i) => !i.savedForLater).length === 0) return res.redirect('/cart');

  const addresses = await Address.find({ user: req.session.user.id }).sort({ isDefault: -1 });
  const summary = computeSummary(cart);
  const codEligible = summary.subtotal <= COD_LIMIT;

  res.render('checkout', {
    addresses, summary, codEligible, codFee: COD_FEE,
    reservationExpiresAt: req.reservationExpiresAt || null,
    razorpayKey: process.env.RAZORPAY_KEY_ID,
  });
});

async function buildOrderPayload(userId, addressId, deliveryOption, paymentMethod, couponCode) {
  const cart = await Cart.findOne({ user: userId }).populate('items.product');
  const address = await Address.findOne({ _id: addressId, user: userId });
  if (!address) throw new Error('Invalid address');

  const summary = computeSummary(cart);
  const codFee = paymentMethod === 'COD' ? COD_FEE : 0;

  // Coupon is re-validated and re-computed here — server-side, authoritative,
  // regardless of what the "Apply" button on the checkout page showed the user.
  let couponDiscount = 0;
  let appliedCouponCode = null;
  if (couponCode) {
    const result = await validateAndCompute(couponCode, userId, summary.subtotal);
    if (result.valid) {
      couponDiscount = result.discount;
      appliedCouponCode = result.coupon.code;
    }
    // If invalid at this point (e.g. expired between apply-click and place-order), it's silently dropped —
    // order still goes through at full price rather than blocking the customer.
  }

  const totalAmount = summary.subtotal + summary.deliveryFee + codFee - couponDiscount;

  const items = summary.lineItems.map((li) => ({
    product: li.product._id,
    variantId: li.variantId,
    variantLabel: li.label,
    seller: li.product.seller,
    name: li.product.name,
    image: li.image,
    quantity: li.quantity,
    price: li.price,
    mrp: li.mrp,
    status: 'PLACED',
    statusHistory: [{ status: 'PLACED' }],
    estimatedDelivery: new Date(Date.now() + (deliveryOption === 'Express' ? 2 : 5) * 86400000),
  }));

  return {
    cart, items, summary, codFee, totalAmount, couponDiscount, appliedCouponCode,
    address: {
      fullName: address.fullName, mobile: address.mobile, houseNumber: address.houseNumber,
      street: address.street, area: address.area, city: address.city, state: address.state,
      pincode: address.pincode, landmark: address.landmark,
    },
  };
}

// ---------- COD ORDER ----------
exports.placeCodOrder = asyncHandler(async (req, res) => {
  const { addressId, deliveryOption, couponCode } = req.body;
  const payload = await buildOrderPayload(req.session.user.id, addressId, deliveryOption, 'COD', couponCode);
  if (payload.summary.subtotal > COD_LIMIT) return res.redirect('/checkout');

  const order = await Order.create({
    user: req.session.user.id,
    items: payload.items,
    address: payload.address,
    deliveryOption,
    paymentMethod: 'COD',
    paymentStatus: 'Pending',
    subtotal: payload.summary.subtotal,
    productDiscount: payload.summary.productDiscount,
    deliveryFee: payload.summary.deliveryFee,
    codFee: payload.codFee,
    couponCode: payload.appliedCouponCode,
    couponDiscount: payload.couponDiscount,
    totalAmount: payload.totalAmount,
  });

  if (payload.appliedCouponCode) await markCouponUsed(payload.appliedCouponCode);

  await cartController.confirmReservations(req.session.user.id);
  payload.cart.items = payload.cart.items.filter((i) => i.savedForLater);
  await payload.cart.save();

  await notify(req.session.user.id, 'ORDER_PLACED', 'Order Placed', `Your order #${order.orderNumber} has been placed successfully.`, `/orders/${order._id}`);
  await sendMail({
    to: req.session.user.email,
    subject: `NOVA MARKET — Order Confirmed #${order.orderNumber}`,
    html: `<p>Hi ${req.session.user.name},</p><p>Your order <b>#${order.orderNumber}</b> for ₹${order.totalAmount} has been placed.</p>`,
  });

  res.redirect(`/order-success/${order._id}`);
});

// ---------- CREATE RAZORPAY ORDER ----------
exports.createRazorpayOrder = asyncHandler(async (req, res) => {
  const { addressId, deliveryOption, couponCode } = req.body;
  const payload = await buildOrderPayload(req.session.user.id, addressId, deliveryOption, 'Online', couponCode);

  const rpOrder = await razorpay.orders.create({
    amount: Math.round(payload.totalAmount * 100),
    currency: 'INR',
    receipt: 'nova_' + Date.now(),
  });

  req.session.pendingOrder = { addressId, deliveryOption, couponCode, razorpayOrderId: rpOrder.id };
  res.json({ success: true, orderId: rpOrder.id, amount: rpOrder.amount, currency: rpOrder.currency });
});

// ---------- VERIFY PAYMENT SIGNATURE (never trust the client) ----------
exports.verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const pending = req.session.pendingOrder;

  if (!pending || pending.razorpayOrderId !== razorpay_order_id) {
    return res.status(400).json({ success: false, message: 'Payment session mismatch.' });
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ success: false, message: 'Payment verification failed.' });
  }

  const payload = await buildOrderPayload(req.session.user.id, pending.addressId, pending.deliveryOption, 'Online', pending.couponCode);

  const order = await Order.create({
    user: req.session.user.id,
    items: payload.items,
    address: payload.address,
    deliveryOption: pending.deliveryOption,
    paymentMethod: 'Online',
    paymentStatus: 'Paid',
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
    subtotal: payload.summary.subtotal,
    productDiscount: payload.summary.productDiscount,
    deliveryFee: payload.summary.deliveryFee,
    codFee: 0,
    couponCode: payload.appliedCouponCode,
    couponDiscount: payload.couponDiscount,
    totalAmount: payload.totalAmount,
  });

  if (payload.appliedCouponCode) await markCouponUsed(payload.appliedCouponCode);

  await cartController.confirmReservations(req.session.user.id);
  payload.cart.items = payload.cart.items.filter((i) => i.savedForLater);
  await payload.cart.save();

  await notify(req.session.user.id, 'PAYMENT_SUCCESS', 'Payment Successful', `Payment of ₹${order.totalAmount} received for order #${order.orderNumber}.`, `/orders/${order._id}`);
  await notify(req.session.user.id, 'ORDER_PLACED', 'Order Placed', `Your order #${order.orderNumber} has been placed successfully.`, `/orders/${order._id}`);
  await sendMail({
    to: req.session.user.email,
    subject: `NOVA MARKET — Order Confirmed #${order.orderNumber}`,
    html: `<p>Hi ${req.session.user.name},</p><p>Your order <b>#${order.orderNumber}</b> for ₹${order.totalAmount} has been placed.</p>`,
  });

  delete req.session.pendingOrder;
  res.json({ success: true, orderId: order._id });
});

// ---------- SUCCESS / LIST / DETAILS / INVOICE ----------
exports.orderSuccess = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.session.user.id });
  if (!order) return res.redirect('/orders');
  res.render('order-success', { order });
});

exports.myOrders = asyncHandler(async (req, res) => {
  const { tab } = req.query;
  const orders = await Order.find({ user: req.session.user.id }).sort({ createdAt: -1 });

  const map = {
    Processing: ['PLACED', 'CONFIRMED', 'PACKED'],
    Shipped: ['SHIPPED', 'OUT_FOR_DELIVERY'],
    Delivered: ['DELIVERED'],
    Cancelled: ['CANCELLED'],
    Returned: ['RETURNED', 'RETURN_REQUESTED'],
    Refunded: ['REFUNDED'],
  };

  const filtered = (!tab || tab === 'All')
    ? orders
    : orders.filter((o) => o.items.some((i) => (map[tab] || []).includes(i.status)));

  res.render('orders', { orders: filtered, activeTab: tab || 'All' });
});

exports.orderDetails = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.session.user.id });
  if (!order) return res.redirect('/orders');
  res.render('order-details', { order });
});

exports.invoice = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.session.user.id });
  if (!order) return res.redirect('/orders');
  res.render('invoice', { order });
});

// ---------- CANCEL ----------
exports.cancelItem = asyncHandler(async (req, res) => {
  const { orderId, itemId } = req.params;
  const { reason } = req.body;

  const order = await Order.findOne({ _id: orderId, user: req.session.user.id });
  if (!order) return res.redirect('/orders');

  const item = order.items.id(itemId);
  if (item && !['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].includes(item.status)) {
    item.status = 'CANCELLED';
    item.cancelReason = reason;
    item.cancelledAt = new Date();
    item.statusHistory.push({ status: 'CANCELLED' });

    if (item.variantId) {
      await Product.updateOne({ _id: item.product, 'variants._id': item.variantId }, { $inc: { 'variants.$.stock': item.quantity } });
    } else {
      await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } });
    }
  }

  await order.save();
  res.redirect(`/orders/${orderId}`);
});