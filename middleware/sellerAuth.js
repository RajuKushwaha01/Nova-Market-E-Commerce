const User = require('../models/User');

// Ensures the logged-in seller has been approved by admin before touching seller tools
exports.requireApprovedSeller = async (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'seller') {
    return res.status(403).render('403');
  }
  const seller = await User.findById(req.session.user.id);
  if (!seller || seller.sellerProfile?.status !== 'approved') {
    return res.render('seller-pending');
  }
  req.sellerDoc = seller;
  next();
};