const mongoose = require('mongoose');

const flashSaleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    salePrice: Number,
    stockLimit: Number,
    sold: { type: Number, default: 0 },
  }],
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('FlashSale', flashSaleSchema);