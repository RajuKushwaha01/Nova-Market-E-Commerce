const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  discountType: { type: String, enum: ['Percentage', 'Fixed'], required: true },
  discountValue: { type: Number, required: true },
  maxDiscount: { type: Number },
  minOrderValue: { type: Number, default: 0 },
  scope: { type: String, enum: ['All', 'Product', 'Category', 'Seller', 'FirstOrder'], default: 'All' },
  scopeRef: { type: mongoose.Schema.Types.ObjectId },
  usageLimit: { type: Number, default: 1000 },
  perUserLimit: { type: Number, default: 1 },
  usedCount: { type: Number, default: 0 },
  expiryDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);