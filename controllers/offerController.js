const FlashSale = require('../models/FlashSale');
const BankOffer = require('../models/BankOffer');
const Product = require('../models/Product');

// ---------- FLASH SALES ----------
exports.listFlashSales = async (req, res) => {
  const sales = await FlashSale.find().populate('products.product', 'name images price').sort({ startTime: -1 });
  const products = await Product.find({ status: 'approved' }).select('name price');
  res.render('admin/flash-sales', { sales, products });
};

exports.createFlashSale = async (req, res) => {
  const { title, startTime, endTime, productIds, salePrices, stockLimits } = req.body;
  const ids = Array.isArray(productIds) ? productIds : [productIds];
  const prices = Array.isArray(salePrices) ? salePrices : [salePrices];
  const limits = Array.isArray(stockLimits) ? stockLimits : [stockLimits];

  const products = ids.map((id, i) => ({ product: id, salePrice: Number(prices[i]), stockLimit: Number(limits[i]) }));
  const sale = await FlashSale.create({ title, startTime, endTime, products });

  // Flag products as flash sale on the storefront
  for (const p of products) {
    await Product.updateOne({ _id: p.product }, { isFlashSale: true, flashSaleEndsAt: endTime, price: p.salePrice });
  }

  res.redirect('/admin/flash-sales');
};

exports.toggleFlashSale = async (req, res) => {
  const sale = await FlashSale.findById(req.params.id);
  sale.isActive = !sale.isActive;
  await sale.save();
  res.redirect('/admin/flash-sales');
};

// ---------- BANK OFFERS ----------
exports.listBankOffers = async (req, res) => {
  const offers = await BankOffer.find().sort({ createdAt: -1 });
  res.render('admin/bank-offers', { offers });
};

exports.createBankOffer = async (req, res) => {
  const { bank, cardType, discountType, discountValue, maxDiscount, minTransaction, startDate, endDate } = req.body;
  await BankOffer.create({ bank, cardType, discountType, discountValue: Number(discountValue), maxDiscount: Number(maxDiscount), minTransaction: Number(minTransaction) || 0, startDate, endDate });
  res.redirect('/admin/bank-offers');
};

exports.toggleBankOffer = async (req, res) => {
  const offer = await BankOffer.findById(req.params.id);
  offer.isActive = !offer.isActive;
  await offer.save();
  res.redirect('/admin/bank-offers');
};

// ---------- PUBLIC: active bank offers for a product page ----------
exports.getActiveBankOffers = async () => {
  const now = new Date();
  return BankOffer.find({ isActive: true, startDate: { $lte: now }, endDate: { $gte: now } });
};