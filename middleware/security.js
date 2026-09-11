const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

// Basic hardening headers
exports.helmetConfig = helmet({
  contentSecurityPolicy: false, // keep false while using CDN Tailwind; tighten in production
});

// Strip $ and . from user input to prevent NoSQL injection
exports.sanitize = mongoSanitize();

// General API/page rate limit
exports.generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: 'Too many requests, please try again later.',
});

// Strict limiter for login/register/forgot-password
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many attempts. Please wait 15 minutes and try again.',
});

// Very basic XSS-escaping helper for rendering user input safely in EJS
exports.escapeHtml = (str = '') =>
  str.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[m]));