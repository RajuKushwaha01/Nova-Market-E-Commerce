const Product = require('../models/Product');

exports.addToCompare = (req, res) => {
  req.session.compareList = req.session.compareList || [];
  const { productId } = req.body;
  if (!req.session.compareList.includes(productId) && req.session.compareList.length < 4) {
    req.session.compareList.push(productId);
  }
  res.redirect(req.get('Referrer') || '/compare');
};

exports.removeFromCompare = (req, res) => {
  req.session.compareList = (req.session.compareList || []).filter((id) => id !== req.params.productId);
  res.redirect('/compare');
};

exports.viewCompare = async (req, res) => {
  const ids = req.session.compareList || [];
  const products = ids.length ? await Product.find({ _id: { $in: ids } }) : [];

  const specKeys = new Set();
  products.forEach((p) => {
    if (p.specifications) {
      for (const key of p.specifications.keys()) specKeys.add(key);
    }
  });

  res.render('compare', { products, specKeys: Array.from(specKeys) });
};