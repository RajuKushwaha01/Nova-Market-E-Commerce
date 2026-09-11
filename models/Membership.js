const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  tier: { type: String, enum: ['Basic', 'Plus', 'Premium'], default: 'Basic' },
  startedAt: { type: Date, default: Date.now },
  expiresAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('Membership', membershipSchema);