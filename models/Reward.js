const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  balance: { type: Number, default: 0 },
  history: [{
    points: Number,
    type: { type: String, enum: ['EARNED', 'REDEEMED', 'EXPIRED'] },
    reason: String,
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    date: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Reward', rewardSchema);