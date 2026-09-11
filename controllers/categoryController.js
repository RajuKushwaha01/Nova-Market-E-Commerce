const Category = require('../models/Category');

// Public: fetch full category tree for nav bar
exports.getNavCategories = async () => {
  const categories = await Category.find({ level: 0, isActive: true }).sort({ order: 1 });
  return categories;
};

exports.getSubcategories = async (req, res) => {
  const subs = await Category.find({ parent: req.params.id, isActive: true }).sort({ order: 1 });
  res.json(subs);
};

// Admin CRUD (used later in Part — Admin Panel), included now for completeness
exports.list = async (req, res) => {
  const categories = await Category.find().populate('parent', 'name').sort({ level: 1, order: 1 });
  res.render('admin/categories', { categories });
};

exports.create = async (req, res) => {
  const { name, parent, filters, order } = req.body;
  let level = 0;
  if (parent) {
    const parentCat = await Category.findById(parent);
    level = parentCat ? parentCat.level + 1 : 0;
  }
  await Category.create({
    name,
    parent: parent || null,
    level,
    filters: filters ? filters.split(',').map((f) => f.trim()) : [],
    order: order || 0,
  });
  res.redirect('/admin/categories');
};

exports.remove = async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.redirect('/admin/categories');
};

exports.toggleActive = async (req, res) => {
  const cat = await Category.findById(req.params.id);
  cat.isActive = !cat.isActive;
  await cat.save();
  res.redirect('/admin/categories');
};