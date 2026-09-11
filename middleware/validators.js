const { body, param, query, validationResult } = require('express-validator');

// Runs after any validator chain — collects errors and re-renders the same page with them
exports.handleValidation = (viewName, extraLocals = {}) => (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    return res.status(422).render(viewName, { ...extraLocals, error: messages.join(' '), success: null });
  }
  next();
};

// Reusable rule sets
exports.registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 60 }),
  body('email').trim().isEmail().withMessage('Enter a valid email').normalizeEmail(),
  body('mobile').optional({ checkFalsy: true }).matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit mobile number'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

exports.loginRules = [
  body('email').trim().isEmail().withMessage('Enter a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

exports.addressRules = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('mobile').matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit mobile number'),
  body('pincode').matches(/^\d{6}$/).withMessage('Enter a valid 6-digit pincode'),
  body('houseNumber').trim().notEmpty().withMessage('House number is required'),
  body('street').trim().notEmpty().withMessage('Street is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
];

exports.productRules = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('category').isMongoId().withMessage('Select a valid category'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('mrp').isFloat({ min: 0 }).withMessage('MRP must be a positive number'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number')
    .custom((value, { req }) => {
      if (Number(value) > Number(req.body.mrp)) throw new Error('Selling price cannot exceed MRP');
      return true;
    }),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
];

exports.couponRules = [
  body('code').trim().notEmpty().isLength({ min: 3, max: 20 }).withMessage('Coupon code must be 3-20 characters'),
  body('discountValue').isFloat({ min: 1 }).withMessage('Discount value must be greater than 0'),
  body('expiryDate').isISO8601().toDate().withMessage('Enter a valid expiry date')
    .custom((value) => {
      if (new Date(value) <= new Date()) throw new Error('Expiry date must be in the future');
      return true;
    }),
];

exports.reviewRules = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('text').trim().isLength({ min: 5, max: 1000 }).withMessage('Review must be 5-1000 characters'),
];

exports.pincodeRules = [
  query('pincode').matches(/^\d{6}$/).withMessage('Enter a valid 6-digit pincode'),
];