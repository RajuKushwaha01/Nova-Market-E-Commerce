const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['ORDER_PLACED', 'PAYMENT_SUCCESS', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED',
      'CANCELLED', 'RETURN', 'REFUND', 'OFFER', 'COUPON', 'PRICE_DROP', 'STOCK_ALERT', 'SUPPORT'],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String, default: '/orders' },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);