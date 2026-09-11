const mongoose = require('mongoose');

const bankOfferSchema = new mongoose.Schema({
  bank: { type: String, required: true },
  cardType: { type: String, enum: ['Credit', 'Debit', 'Both'], default: 'Both' },
  discountType: { type: String, enum: ['Percentage', 'Fixed'], default: 'Percentage' },
  discountValue: { type: Number, required: true },
  maxDiscount: { type: Number, required: true },
  minTransaction: { type: Number, default: 0 },
  startDate: Date,
  endDate: Date,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('BankOffer', bankOfferSchema);