const Wishlist = require('../models/Wishlist');
const Cart = require('../models/Cart');

exports.viewWishlist = async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.session.user.id }).populate('items.product');
  const items = wishlist ? wishlist.items.filter((i) => i.product) : [];
  res.render('wishlist', { items });
};

// AJAX toggle used by the ♡ button on product cards
exports.toggle = async (req, res) => {
  try {
    const { productId } = req.body;
    let wishlist = await Wishlist.findOne({ user: req.session.user.id });
    if (!wishlist) wishlist = await Wishlist.create({ user: req.session.user.id, items: [] });

    const idx = wishlist.items.findIndex((i) => i.product.toString() === productId);
    let added;
    if (idx > -1) {
      wishlist.items.splice(idx, 1);
      added = false;
    } else {
      wishlist.items.push({ product: productId });
      added = true;
    }
    await wishlist.save();
    res.json({ success: true, added, count: wishlist.items.length });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

exports.remove = async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.session.user.id });
  wishlist.items = wishlist.items.filter((i) => i.product.toString() !== req.params.productId);
  await wishlist.save();
  res.redirect('/wishlist');
};

exports.moveToCart = async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.session.user.id });
  const item = wishlist.items.find((i) => i.product.toString() === req.params.productId);
  if (item) {
    let cart = await Cart.findOne({ user: req.session.user.id });
    if (!cart) cart = await Cart.create({ user: req.session.user.id, items: [] });
    cart.items.push({ product: item.product, quantity: 1 });
    await cart.save();

    wishlist.items = wishlist.items.filter((i) => i.product.toString() !== req.params.productId);
    await wishlist.save();
  }
  res.redirect('/wishlist');
};