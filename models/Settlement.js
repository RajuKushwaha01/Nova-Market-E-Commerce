const mongoose = require('mongoose');

// One settlement record per delivered order-item — this is what "Available Balance" is computed from
const settlementSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, required: true },

  saleAmount: Number,
  commissionPercent: Number,
  commissionAmount: Number,
  fixedFee: Number,
  shippingFee: Number,
  paymentFee: Number,
  netPayable: Number,

  status: { type: String, enum: ['PENDING', 'AVAILABLE', 'PAID', 'REVERSED'], default: 'PENDING' },
  paidAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('Settlement', settlementSchema);