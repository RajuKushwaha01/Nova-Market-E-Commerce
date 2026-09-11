const Cart = require('../models/Cart');
const Product = require('../models/Product');
const StockReservation = require('../models/StockReservation');

// Helper — resolve price/stock/name for a cart line, whether it's a variant or base product
function resolveLineInfo(product, variantId) {
  if (variantId) {
    const variant = product.variants.id(variantId);
    if (!variant) return null;
    return {
      price: variant.price,
      mrp: variant.mrp,
      available: variant.stock - (variant.reservedStock || 0),
      image: variant.images[0] || product.images[0],
      label: Array.from(variant.attributes.values()).join(' / '),
    };
  }
  return {
    price: product.price,
    mrp: product.mrp,
    available: product.stock - (product.reservedStock || 0),
    image: product.images[0],
    label: null,
  };
}

// ---------- VIEW CART (grouped by seller, server-computed totals) ----------
exports.viewCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.session.user.id }).populate({
    path: 'items.product',
    populate: { path: 'seller', select: 'name sellerProfile.businessName' },
  });

  if (!cart) return res.render('cart', { sellerGroups: [], savedItems: [], summary: null });

  const activeItems = cart.items.filter((i) => !i.savedForLater && i.product);
  const savedItems = cart.items.filter((i) => i.savedForLater && i.product);

  // Group active items by seller — this is what makes it a "multi-seller cart"
  const groupsMap = new Map();
  let subtotal = 0;
  let totalMrp = 0;
  let hasIssues = false;

  for (const item of activeItems) {
    const info = resolveLineInfo(item.product, item.variantId);
    if (!info) continue;

    const sellerId = item.product.seller ? item.product.seller._id.toString() : 'unknown';
    const sellerName = item.product.seller?.sellerProfile?.businessName || item.product.seller?.name || 'NOVA Market';

    if (!groupsMap.has(sellerId)) {
      groupsMap.set(sellerId, { sellerId, sellerName, items: [], sellerTotal: 0 });
    }

    const lineTotal = info.price * item.quantity;
    subtotal += lineTotal;
    totalMrp += info.mrp * item.quantity;

    const stockOk = item.quantity <= info.available;
    if (!stockOk) hasIssues = true;

    groupsMap.get(sellerId).items.push({
      cartItemId: item._id,
      product: item.product,
      variantId: item.variantId,
      quantity: item.quantity,
      price: info.price,
      mrp: info.mrp,
      image: info.image,
      label: info.label,
      lineTotal,
      stockOk,
      availableStock: info.available,
    });
    groupsMap.get(sellerId).sellerTotal += lineTotal;
  }

  const sellerGroups = Array.from(groupsMap.values());

  const productDiscount = totalMrp - subtotal;
  const deliveryFee = subtotal > 499 || subtotal === 0 ? 0 : 40;
  const tax = Math.round(subtotal * 0.0); // GST already baked into product price in this simplified model
  const finalAmount = subtotal + deliveryFee + tax;

  const summary = { totalMrp, productDiscount, deliveryFee, tax, subtotal, finalAmount, hasIssues };

  res.render('cart', { sellerGroups, savedItems, summary });
};

// ---------- ADD TO CART ----------
exports.addToCart = async (req, res) => {
  const { productId, variantId, quantity } = req.body;
  const qty = Math.max(1, Number(quantity) || 1);

  const product = await Product.findById(productId);
  if (!product || product.status !== 'approved') return res.redirect(req.get('Referrer') || '/cart');

  const info = resolveLineInfo(product, variantId || null);
  if (!info || info.available < qty) {
    req.session.cartMessage = 'Not enough stock available.';
    return res.redirect(req.get('Referrer') || '/cart');
  }

  let cart = await Cart.findOne({ user: req.session.user.id });
  if (!cart) cart = await Cart.create({ user: req.session.user.id, items: [] });

  const existing = cart.items.find(
    (i) => i.product.toString() === productId &&
      String(i.variantId || '') === String(variantId || '') &&
      !i.savedForLater
  );

  if (existing) existing.quantity += qty;
  else cart.items.push({ product: productId, variantId: variantId || null, quantity: qty });

  await cart.save();
  res.redirect('/cart');
};

exports.updateItem = async (req, res) => {
  const { cartItemId, quantity } = req.body;
  const cart = await Cart.findOne({ user: req.session.user.id });
  const item = cart.items.id(cartItemId);
  if (item) item.quantity = Math.max(1, Number(quantity));
  await cart.save();
  res.redirect('/cart');
};

exports.removeItem = async (req, res) => {
  const cart = await Cart.findOne({ user: req.session.user.id });
  cart.items.pull({ _id: req.params.cartItemId });
  await cart.save();
  return res.redirect(req.get('Referrer') || '/cart');
};

// ---------- SAVE FOR LATER ----------
exports.saveForLater = async (req, res) => {
  const cart = await Cart.findOne({ user: req.session.user.id });
  const item = cart.items.id(req.params.cartItemId);
  if (item) item.savedForLater = true;
  await cart.save();
  res.redirect('/cart');
};

exports.moveToCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.session.user.id });
  const item = cart.items.id(req.params.cartItemId);
  if (item) item.savedForLater = false;
  await cart.save();
  res.redirect('/cart');
};

// ---------- STOCK RESERVATION (called when entering checkout) ----------
exports.reserveStockForCheckout = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.session.user.id }).populate('items.product');
    const activeItems = cart.items.filter((i) => !i.savedForLater && i.product);

    if (activeItems.length === 0) return res.redirect('/cart');

    // Release any of this user's previous reservations first (fresh 15-min window)
    await StockReservation.deleteMany({ user: req.session.user.id });
    await releaseUserReservationEffects(req.session.user.id);

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    for (const item of activeItems) {
      const info = resolveLineInfo(item.product, item.variantId);
      if (!info || info.available < item.quantity) {
        req.session.cartMessage = `"${item.product.name}" no longer has enough stock.`;
        return res.redirect('/cart');
      }

      if (item.variantId) {
        await Product.updateOne(
          { _id: item.product._id, 'variants._id': item.variantId },
          { $inc: { 'variants.$.reservedStock': item.quantity } }
        );
      } else {
        await Product.updateOne({ _id: item.product._id }, { $inc: { reservedStock: item.quantity } });
      }

      await StockReservation.create({
        product: item.product._id,
        variantId: item.variantId,
        user: req.session.user.id,
        quantity: item.quantity,
        expiresAt,
      });
    }

    req.reservationExpiresAt = expiresAt;
    next();
  } catch (err) {
    console.error(err);
    res.redirect('/cart');
  }
};

async function releaseUserReservationEffects(userId) {
  // Called before re-reserving — kept separate in case you want to log/audit releases later
}

exports.confirmReservations = async (userId) => {
  // Called after successful order placement — converts reservation into real stock deduction
  const reservations = await StockReservation.find({ user: userId });
  for (const r of reservations) {
    if (r.variantId) {
      await Product.updateOne(
        { _id: r.product, 'variants._id': r.variantId },
        { $inc: { 'variants.$.stock': -r.quantity, 'variants.$.reservedStock': -r.quantity } }
      );
    } else {
      await Product.updateOne({ _id: r.product }, { $inc: { stock: -r.quantity, reservedStock: -r.quantity } });
    }
  }
  await StockReservation.deleteMany({ user: userId });
};

exports.resolveLineInfo = resolveLineInfo;