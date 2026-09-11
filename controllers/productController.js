const Product = require('../models/Product');
const Category = require('../models/Category');
const Banner = require('../models/Banner');
const SearchHistory = require('../models/SearchHistory');
const Question = require('../models/Question');
const { getNavCategories } = require('./categoryController');
const { getProductQuestions } = require('./questionController');
const { getProductReviews, canReview } = require('./reviewController');

// ---------- HOMEPAGE ----------
exports.home = async (req, res) => {
  const navCategories = await getNavCategories();
  const now = new Date();

  const [banners, trending, flashSale, newArrivals, bestSellers, topCategories] = await Promise.all([
    Banner.find({ isActive: true, type: 'Homepage' }).sort({ priority: -1 }).limit(5),
    Product.find({ status: 'approved' }).sort({ soldCount: -1 }).limit(8),
    Product.find({ status: 'approved', isFlashSale: true, flashSaleEndsAt: { $gt: now } }).limit(8),
    Product.find({ status: 'approved' }).sort({ createdAt: -1 }).limit(8),
    Product.find({ status: 'approved' }).sort({ soldCount: -1 }).limit(8),
    Category.find({ level: 0, isActive: true }).sort({ order: 1 }).limit(10),
  ]);

  // Recently viewed (from session)
  const recentIds = req.session.recentlyViewed || [];
  const recentlyViewed = recentIds.length
    ? await Product.find({ _id: { $in: recentIds }, status: 'approved' })
    : [];

  res.render('index', {
    navCategories, banners, trending, flashSale, newArrivals, bestSellers, topCategories, recentlyViewed,
  });
};

// ---------- PRODUCT LISTING WITH FILTERS + SORT ----------
exports.list = async (req, res) => {
  const { q, category, brand, minPrice, maxPrice, rating, discount, sort, page = 1 } = req.query;
  const filter = { status: 'approved' };

  if (q) filter.$text = { $search: q };
  if (category) {
    const cat = await Category.findOne({ slug: category });
    if (cat) filter.category = cat._id;
  }
  if (brand) filter.brand = { $in: brand.split(',') };
  if (rating) filter.rating = { $gte: Number(rating) };
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  let sortOption = { createdAt: -1 };
  if (sort === 'price_low') sortOption = { price: 1 };
  if (sort === 'price_high') sortOption = { price: -1 };
  if (sort === 'rating') sortOption = { rating: -1 };
  if (sort === 'popularity') sortOption = { soldCount: -1 };
  if (sort === 'newest') sortOption = { createdAt: -1 };
  if (sort === 'discount') sortOption = { createdAt: -1 }; // computed field; filtered post-query below

  const limit = 20;
  const skip = (Number(page) - 1) * limit;

  const productsQuery = Product.find(filter).sort(sortOption).skip(skip).limit(limit);
  const [products, totalCount, brands, categories, navCategories] = await Promise.all([
    productsQuery,
    Product.countDocuments(filter),
    Product.distinct('brand', { status: 'approved' }),
    Category.find({ level: 0, isActive: true }),
    getNavCategories(),
  ]);

  let filteredProducts = products;
  if (discount) {
    filteredProducts = products.filter((p) => p.discountPercent >= Number(discount));
  }

  res.render('products', {
    products: filteredProducts,
    totalCount,
    currentPage: Number(page),
    totalPages: Math.ceil(totalCount / limit),
    brands,
    categories,
    navCategories,
    query: req.query,
  });
};

// ---------- LIVE SEARCH SUGGESTIONS (AJAX) ----------
exports.searchSuggestions = async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json({ products: [], brands: [], categories: [] });

  const regex = new RegExp(q, 'i');

  const [products, brands, categories] = await Promise.all([
    Product.find({ status: 'approved', name: regex }).select('name images price').limit(5),
    Product.distinct('brand', { status: 'approved', brand: regex }),
    Category.find({ isActive: true, name: regex }).select('name slug').limit(5),
  ]);

  res.json({ products, brands: brands.slice(0, 5), categories });
};

// ---------- SEARCH PAGE + HISTORY ----------
exports.search = async (req, res) => {
  const { q } = req.query;
  if (q && req.session.user) {
    await SearchHistory.create({ user: req.session.user.id, query: q });
  }

  let recentSearches = [];
  if (req.session.user) {
    recentSearches = await SearchHistory.find({ user: req.session.user.id })
      .sort({ createdAt: -1 })
      .limit(8);
  }

  const trendingSearches = await SearchHistory.aggregate([
    { $group: { _id: '$query', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 8 },
  ]);

  const filter = { status: 'approved' };
  if (q) filter.$text = { $search: q };
  const results = q ? await Product.find(filter).limit(40) : [];

  const navCategories = await getNavCategories();

  res.render('search-results', { results, q: q || '', recentSearches, trendingSearches, navCategories });
};

exports.deleteSearchHistoryItem = async (req, res) => {
  await SearchHistory.findOneAndDelete({ _id: req.params.id, user: req.session.user.id });
  res.redirect('back');
};

exports.clearSearchHistory = async (req, res) => {
  await SearchHistory.deleteMany({ user: req.session.user.id });
  res.redirect('back');
};

// ---------- PRODUCT DETAILS ----------
exports.details = async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category subCategory seller', 'name sellerProfile.businessName');
  if (!product || product.status !== 'approved') return res.status(404).render('404');

  // Track a view for analytics (Part 5 — seller analytics conversion rate)
  await Product.updateOne({ _id: product._id }, { $inc: { viewCount: 1 } });

  const [related, frequentlyBought, questions] = await Promise.all([
    Product.find({ category: product.category, _id: { $ne: product._id }, status: 'approved' }).limit(4),
    Product.find({ category: product.category, _id: { $ne: product._id }, status: 'approved' }).limit(3),
    getProductQuestions(product._id),
  ]);

  // Recently viewed tracking (session-based)
  req.session.recentlyViewed = req.session.recentlyViewed || [];
  req.session.recentlyViewed = req.session.recentlyViewed.filter((id) => id !== req.params.id);
  req.session.recentlyViewed.unshift(req.params.id);
  req.session.recentlyViewed = req.session.recentlyViewed.slice(0, 10);

  const inWishlist = req.session.user
    ? !!(await require('../models/Wishlist').findOne({ user: req.session.user.id, 'items.product': product._id }))
    : false;

  const reviews = await getProductReviews(product._id, req.query.reviewSort);
  const userCanReview = req.session.user ? await canReview(req.session.user.id, product._id) : false;
  const reviewError = req.session.reviewError;
  delete req.session.reviewError;

  res.render('product-details', {
    product, related, frequentlyBought, questions, inWishlist,
    reviews, userCanReview, reviewError,
    metaTitle: `${product.name} - Buy Online at Best Price | NOVA MARKET`,
    metaDescription: product.description.slice(0, 155),
  });
};

// ---------- PINCODE DELIVERY CHECKER (AJAX) ----------
exports.checkPincode = (req, res) => {
  const { pincode } = req.query;
  if (!/^\d{6}$/.test(pincode || '')) {
    return res.json({ valid: false, message: 'Enter a valid 6-digit pincode.' });
  }
  // Simplified deterministic mock — replace with a real shipping API later
  const lastDigit = Number(pincode[5]);
  const deliverable = lastDigit % 5 !== 0;
  const days = 3 + (lastDigit % 4);
  const codAvailable = lastDigit % 3 !== 0;

  res.json({
    valid: true,
    deliverable,
    estimatedDate: deliverable ? `Delivery by ${new Date(Date.now() + days * 86400000).toDateString()}` : null,
    codAvailable,
    freeDelivery: true,
  });
};