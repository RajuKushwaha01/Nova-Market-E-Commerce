const multer = require('multer');

// Multer errors (file too large, too many files, wrong field name, disallowed
// file type from fileFilter) are thrown synchronously inside multer's own
// middleware and are NOT caught by asyncHandler or the global errorHandler
// automatically — they need this dedicated 4-arg error handler placed
// immediately after upload.array()/upload.single() in the route chain.
exports.handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    let message = 'Image upload failed. Please try again.';
    if (err.code === 'LIMIT_FILE_SIZE') message = 'One of your images is too large — each file must be under 10MB.';
    if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') message = 'You can upload a maximum of 6 images.';

    req.session.productFormError = message;
    return res.redirect(req.originalUrl.includes('/edit') ? req.get('Referrer') || '/seller/products' : '/seller/products/add');
  }

  if (err && err.message && err.message.includes('Only jpg, jpeg, png')) {
    req.session.productFormError = err.message;
    return res.redirect(req.originalUrl.includes('/edit') ? req.get('Referrer') || '/seller/products' : '/seller/products/add');
  }

  next(err); // not a multer/fileFilter error — pass through to the global error handler
};