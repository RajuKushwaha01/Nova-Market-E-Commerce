exports.requireCloudinaryConfigured = (req, res, next) => {
  if (!cloudinaryConfigured) {
    req.session.productFormError = 'Image upload is not configured yet. Ask the site admin to set Cloudinary credentials in .env, then try again.';
    return res.redirect('/seller/products/add');
  }
  next();
};