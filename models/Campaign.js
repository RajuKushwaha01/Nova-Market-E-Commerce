const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  type: { type: String, enum: ['Sponsored', 'SearchAd', 'CategoryAd'], default: 'Sponsored' },
  budget: { type: Number, required: true },
  spend: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  impressions: { type: Number, default: 0 },
  conversions: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'active', 'paused', 'completed'], default: 'pending' },
  startDate: Date,
  endDate: Date,
}, { timestamps: true });

module.exports = mongoose.model('Campaign', campaignSchema);