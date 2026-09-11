const mongoose = require('mongoose');

// A temporary hold on stock while a customer is checking out.
// A background job (services/stockReservationJob.js) releases expired holds.
const stockReservationSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quantity: { type: Number, required: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.model('StockReservation', stockReservationSchema);