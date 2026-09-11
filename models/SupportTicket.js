const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  senderRole: { type: String, enum: ['customer', 'support', 'admin'] },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const ticketSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  category: { type: String, enum: ['Order Issue', 'Payment Issue', 'Return Issue', 'Product Issue', 'Other'], default: 'Other' },
  relatedOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED'], default: 'OPEN' },
  messages: [messageSchema],
}, { timestamps: true });

module.exports = mongoose.model('SupportTicket', ticketSchema);