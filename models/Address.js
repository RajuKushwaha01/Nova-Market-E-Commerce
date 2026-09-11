const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fullName: { type: String, required: true },
  mobile: { type: String, required: true },
  houseNumber: { type: String, required: true },
  street: { type: String, required: true },
  area: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, default: 'India' },
  pincode: { type: String, required: true },
  landmark: { type: String },
  addressType: { type: String, enum: ['Home', 'Work', 'Other'], default: 'Home' },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Address', addressSchema);