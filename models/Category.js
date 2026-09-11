const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true },
  icon: { type: String, default: '' },       // icon name or image URL
  image: { type: String, default: '' },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  level: { type: Number, default: 0 },        // 0 = top category, 1 = sub, 2 = sub-sub
  filters: [{ type: String }],                // e.g. ['RAM','Storage','Color'] — drives dynamic filters
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

categorySchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);