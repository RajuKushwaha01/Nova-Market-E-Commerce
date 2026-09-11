const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  answeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  answererRole: { type: String, enum: ['seller', 'admin'], default: 'seller' },
  text: { type: String, required: true },
  helpfulCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const questionSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  askedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  answers: [answerSchema],
  helpfulCount: { type: Number, default: 0 },
  isReported: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);