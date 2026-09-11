const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { HttpError, asyncHandler } = require('../middleware/errorHandler');

// Business rule: only a verified purchaser (item marked DELIVERED) can review
exports.canReview = async (userId, productId) => {
  const order = await Order.findOne({
    user: userId,
    items: { $elemMatch: { product: productId, status: 'DELIVERED' } },
  });
  return !!order;
};

exports.submitReview = asyncHandler(async (req, res) => {
  const { productId, rating, title, text, images } = req.body;

  const eligible = await exports.canReview(req.session.user.id, productId);
  if (!eligible) {
    throw new HttpError(403, 'Only customers who purchased and received this product can leave a review.');
  }

  const order = await Order.findOne({
    user: req.session.user.id,
    items: { $elemMatch: { product: productId, status: 'DELIVERED' } },
  });

  // Upsert — one review per user per product (edit if it already exists)
  await Review.findOneAndUpdate(
    { product: productId, user: req.session.user.id },
    {
      product: productId, user: req.session.user.id, order: order._id,
      rating: Number(rating), title, text,
      images: images ? images.split(',').map((s) => s.trim()).filter(Boolean) : [],
      isVerifiedPurchase: true,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await recalculateProductRating(productId);
  res.redirect(`/product/${productId}#reviews`);
});

async function recalculateProductRating(productId) {
  const stats = await Review.aggregate([
    { $match: { product: new (require('mongoose').Types.ObjectId)(productId) } },
    { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const { avgRating = 0, count = 0 } = stats[0] || {};
  await Product.updateOne({ _id: productId }, { rating: Math.round(avgRating * 10) / 10, reviewCount: count });
}

exports.getProductReviews = async (productId, sort = 'newest') => {
  let sortOption = { createdAt: -1 };
  if (sort === 'helpful') sortOption = { helpfulCount: -1 };
  if (sort === 'highest') sortOption = { rating: -1 };
  if (sort === 'lowest') sortOption = { rating: 1 };

  return Review.find({ product: productId }).populate('user', 'name').sort(sortOption).limit(50);
};

exports.markHelpful = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new HttpError(404, 'Review not found');

  const userId = req.session.user.id;
  const alreadyVoted = review.helpfulVoters.some((v) => v.toString() === userId);

  if (alreadyVoted) {
    review.helpfulVoters = review.helpfulVoters.filter((v) => v.toString() !== userId);
    review.helpfulCount = Math.max(0, review.helpfulCount - 1);
  } else {
    review.helpfulVoters.push(userId);
    review.helpfulCount += 1;
  }
  await review.save();
  res.redirect(req.get('Referrer') || '/');
});

exports.deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findOneAndDelete({ _id: req.params.id, user: req.session.user.id });
  if (review) await recalculateProductRating(review.product);
  res.redirect(req.get('Referrer') || '/');
});