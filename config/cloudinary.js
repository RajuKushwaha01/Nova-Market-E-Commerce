const cloudinary = require('cloudinary').v2;

// .trim() guards against invisible trailing whitespace/newlines in .env values —
// Admin API calls (ping) use Basic Auth and tolerate this silently, but signed
// Upload API calls compute a hash including the secret, so a stray character
// there causes every upload to fail with a 403 even though ping succeeds.
cloudinary.config({
  cloud_name: (process.env.CLOUDINARY_CLOUD_NAME || '').trim(),
  api_key: (process.env.CLOUDINARY_API_KEY || '').trim(),
  api_secret: (process.env.CLOUDINARY_API_SECRET || '').trim(),
});

module.exports = cloudinary;