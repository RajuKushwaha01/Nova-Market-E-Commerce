const mongoose = require('mongoose');
const slugify = require('slugify');

const variantSchema = new mongoose.Schema({
  sku: { type: String, required: true },
  attributes: { type: Map, of: String },  // e.g. { Color: 'Black', RAM: '8GB', Storage: '128GB' }
  price: { type: Number, required: true },
  mrp: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  reservedStock: { type: Number, default: 0 },
  images: [{ type: String }],
}, { _id: true });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, index: true },
  slug: { type: String, unique: true, sparse: true, index: true },
  sku: { type: String, unique: true, sparse: true },
  brand: { type: String, default: 'Generic', index: true },

  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  subCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },

  description: { type: String, required: true },
  highlights: [{ type: String }],
  specifications: { type: Map, of: String },   // { Processor: 'A18', Battery: '4000mAh' }

  images: [{ type: String }],
  videos: [{ type: String }],

  mrp: { type: Number, required: true },
  price: { type: Number, required: true },
  gst: { type: Number, default: 18 },
  stock: { type: Number, default: 0 },
  reservedStock: { type: Number, default: 0 }, // held during active checkouts

  variants: [variantSchema],

  warranty: { type: String, default: '1 Year Manufacturer Warranty' },
  returnPolicy: { type: String, default: '7 Days Replacement' },
  deliveryDays: { type: Number, default: 5 },

  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },

  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'disabled'], default: 'pending' },

  isFeatured: { type: Boolean, default: false },
  isFlashSale: { type: Boolean, default: false },
  flashSaleEndsAt: { type: Date },

  soldCount: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },
}, { timestamps: true });

productSchema.pre('save', function (next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true }) + '-' + this._id.toString().slice(-6);
  }
  next();
});

productSchema.index({ name: 'text', brand: 'text', description: 'text' });
productSchema.index({ status: 1, category: 1, price: 1 });
productSchema.index({ status: 1, soldCount: -1 });

productSchema.virtual('discountPercent').get(function () {
  if (!this.mrp || this.mrp <= this.price) return 0;
  return Math.round(((this.mrp - this.price) / this.mrp) * 100);
});

productSchema.virtual('availableStock').get(function () {
  return Math.max(0, this.stock - (this.reservedStock || 0));
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);