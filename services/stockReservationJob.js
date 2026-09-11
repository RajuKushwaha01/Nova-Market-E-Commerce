const StockReservation = require('../models/StockReservation');
const Product = require('../models/Product');

// Runs every 60 seconds: releases any reservation whose hold has expired,
// giving stock back to the pool. This prevents phantom "reserved forever" stock
// when a customer abandons checkout.
async function releaseExpiredReservations() {
  const expired = await StockReservation.find({ expiresAt: { $lte: new Date() } });

  for (const res of expired) {
    if (res.variantId) {
      await Product.updateOne(
        { _id: res.product, 'variants._id': res.variantId },
        { $inc: { 'variants.$.reservedStock': -res.quantity } }
      );
    } else {
      await Product.updateOne({ _id: res.product }, { $inc: { reservedStock: -res.quantity } });
    }
    await StockReservation.findByIdAndDelete(res._id);
  }
}

exports.start = () => {
  setInterval(releaseExpiredReservations, 60 * 1000);
  console.log('🔄 Stock reservation cleanup job started (runs every 60s)');
};