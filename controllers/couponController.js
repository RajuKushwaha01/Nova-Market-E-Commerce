const Coupon = require('../models/Coupon');
const Order = require('../models/Order');

// Single source of truth for coupon validity + discount math.
// Used by BOTH the AJAX "apply" check at checkout AND order placement itself —
// so the discount actually charged is always recomputed server-side, never trusted from the client.
async function validateAndCompute(code, userId, orderValue) {
  const coupon = await Coupon.findOne({ code: (code || '').toUpperCase(), isActive: true, expiryDate: { $gte: new Date() } });

  if (!coupon) return { valid: false, message: 'Invalid or expired coupon.' };
  if (coupon.usedCount >= coupon.usageLimit) return { valid: false, message: 'Coupon usage limit reached.' };
  if (orderValue < coupon.minOrderValue) return { valid: false, message: `Minimum order value ₹${coupon.minOrderValue} required.` };

  const userUsage = await Order.countDocuments({ user: userId, couponCode: coupon.code });
  if (userUsage >= coupon.perUserLimit) return { valid: false, message: 'You have already used this coupon.' };

  if (coupon.scope === 'FirstOrder') {
    const orderCount = await Order.countDocuments({ user: userId });
    if (orderCount > 0) return { valid: false, message: 'This coupon is valid for first orders only.' };
  }

  let discount = coupon.discountType === 'Percentage'
    ? Math.round(orderValue * (coupon.discountValue / 100))
    : coupon.discountValue;

  if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(discount, orderValue); // never discount more than the order is worth

  return { valid: true, coupon, discount, message: `Coupon applied! You saved ₹${discount}.` };
}
exports.validateAndCompute = validateAndCompute;

// ---------- CUSTOMER: apply coupon at checkout (AJAX) ----------
exports.applyCoupon = async (req, res) => {
  try {
    const { code, orderValue } = req.body;
    const result = await validateAndCompute(code, req.session.user.id, Number(orderValue));

    if (!result.valid) return res.json({ success: false, message: result.message });

    res.json({ success: true, code: result.coupon.code, discount: result.discount, message: result.message });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Something went wrong.' });
  }
};

// Called once an order is actually placed successfully — this is what was missing before
exports.markCouponUsed = async (code) => {
  if (!code) return;
  await Coupon.updateOne({ code: code.toUpperCase() }, { $inc: { usedCount: 1 } });
};

// ---------- ADMIN CRUD (unchanged from Part 6) ----------
exports.list = async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.render('admin/coupons', { coupons });
};

exports.create = async (req, res) => {
  const { code, discountType, discountValue, maxDiscount, minOrderValue, scope, usageLimit, perUserLimit, expiryDate } = req.body;
  await Coupon.create({
    code, discountType, discountValue: Number(discountValue),
    maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
    minOrderValue: Number(minOrderValue) || 0, scope,
    usageLimit: Number(usageLimit) || 1000, perUserLimit: Number(perUserLimit) || 1,
    expiryDate,
  });
  await require('../middleware/audit').logAction(req, { action: 'Created coupon', entity: 'Coupon', newValue: { code } });
  res.redirect('/admin/coupons');
};

exports.toggle = async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  coupon.isActive = !coupon.isActive;
  await coupon.save();
  res.redirect('/admin/coupons');
};

exports.remove = async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.redirect('/admin/coupons');
};