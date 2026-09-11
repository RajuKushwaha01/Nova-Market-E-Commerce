const mongoose = require('mongoose');

// Admin-configurable commission rules per category
const commissionSchema = new mongoose.Schema({
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, unique: true },
  commissionPercent: { type: Number, required: true, default: 10 },
  fixedFee: { type: Number, default: 0 },
  shippingFee: { type: Number, default: 0 },
  paymentFee: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Commission', commissionSchema);