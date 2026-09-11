const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  image: { type: String, required: true },
  link: { type: String, default: '/products' },
  type: { type: String, enum: ['Homepage', 'Category', 'Sale', 'Mobile', 'Desktop'], default: 'Homepage' },
  priority: { type: Number, default: 0 },
  startDate: { type: Date },
  endDate: { type: Date },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Banner', bannerSchema);