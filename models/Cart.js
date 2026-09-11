const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: mongoose.Schema.Types.ObjectId, default: null }, // null = base product, else Product.variants._id
  quantity: { type: Number, default: 1, min: 1 },
  savedForLater: { type: Boolean, default: false },
  addedAt: { type: Date, default: Date.now },
});

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [cartItemSchema],
  appliedCoupon: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);