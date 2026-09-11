const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema({
  reason: String,
  details: String,
  images: [String],
  type: { type: String, enum: ['RETURN', 'EXCHANGE'], default: 'RETURN' },
  status: { type: String, enum: ['REQUESTED', 'APPROVED', 'REJECTED', 'PICKED_UP', 'REFUNDED'], default: 'REQUESTED' },
  refundStatus: { type: String, enum: ['NOT_APPLICABLE', 'REQUESTED', 'APPROVED', 'PROCESSING', 'COMPLETED', 'FAILED'], default: 'NOT_APPLICABLE' },
  requestedAt: { type: Date, default: Date.now },
}, { _id: false });

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
  variantLabel: String,
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  image: String,
  quantity: Number,
  price: Number,
  mrp: Number,

  status: {
    type: String,
    enum: ['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED',
      'CANCELLED', 'RETURN_REQUESTED', 'RETURNED', 'REFUNDED'],
    default: 'PLACED',
  },
  statusHistory: [{ status: String, date: { type: Date, default: Date.now } }],

  trackingId: String,
  courier: String,
  estimatedDelivery: Date,

  cancelReason: String,
  cancelledAt: Date,

  returnInfo: returnSchema,
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],

  address: {
    fullName: String, mobile: String, houseNumber: String, street: String,
    area: String, city: String, state: String, pincode: String, landmark: String,
  },

  deliveryOption: { type: String, enum: ['Standard', 'Express'], default: 'Standard' },
  paymentMethod: { type: String, enum: ['COD', 'Online'], default: 'COD' },
  paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed', 'Refunded'], default: 'Pending' },

  couponCode: { type: String, default: null },
  couponDiscount: { type: Number, default: 0 },

  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,

  subtotal: Number,
  productDiscount: Number,
  deliveryFee: Number,
  codFee: { type: Number, default: 0 },
  totalAmount: Number,
}, { timestamps: true });

orderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    this.orderNumber = 'NOVA' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 90 + 10);
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);