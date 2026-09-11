const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true }, // proof of purchase
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, trim: true },
  text: { type: String, required: true },
  images: [{ type: String }],
  isVerifiedPurchase: { type: Boolean, default: true },
  helpfulCount: { type: Number, default: 0 },
  helpfulVoters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

// One review per user per product (edit instead of duplicate)
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);