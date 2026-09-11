const Brand = require('../models/Brand');
const { logAction } = require('../middleware/audit');

exports.list = async (req, res) => {
  const brands = await Brand.find().sort({ name: 1 });
  res.render('admin/brands', { brands });
};

exports.create = async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.redirect('/admin/brands');
  const brand = await Brand.create({ name: name.trim() });
  await logAction(req, { action: 'Created brand', entity: 'Brand', entityId: brand._id, newValue: { name } });
  res.redirect('/admin/brands');
};

exports.toggle = async (req, res) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) return res.redirect('/admin/brands');
  const old = brand.isActive;
  brand.isActive = !brand.isActive;
  await brand.save();
  await logAction(req, { action: 'Toggled brand status', entity: 'Brand', entityId: brand._id, oldValue: old, newValue: brand.isActive });
  res.redirect('/admin/brands');
};

exports.remove = async (req, res) => {
  await Brand.findByIdAndDelete(req.params.id);
  await logAction(req, { action: 'Deleted brand', entity: 'Brand', entityId: req.params.id });
  res.redirect('/admin/brands');
};