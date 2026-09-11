const upload = require('../config/upload');

// Runs BEFORE multer touches the request. If Cloudinary isn't configured,
// reject immediately with a clear message instead of letting multer hang
// trying to authenticate with empty credentials until the browser times out.
exports.requireCloudinaryConfigured = (req, res, next) => {
  if (!upload.cloudinaryConfigured) {
    req.session.productFormError = 'Image upload is not configured yet. Ask the site admin to set Cloudinary credentials in .env, then try again.';
    return res.redirect(req.get('Referrer') || '/seller/products/add');
  }
  next();
};