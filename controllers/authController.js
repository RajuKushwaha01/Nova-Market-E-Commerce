const User = require('../models/User');
const { sendMail } = require('../config/mailer');
const crypto = require('crypto');
const { logAction } = require('../middleware/audit');
const { ADMIN_TIER_ROLES } = require('../config/permissions');

exports.getRegister = (req, res) => res.render('register', { error: null });

exports.postRegister = async (req, res) => {
  try {
    const { name, email, mobile, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.render('register', { error: 'Passwords do not match.' });
    }
    if (password.length < 8) {
      return res.render('register', { error: 'Password must be at least 8 characters.' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.render('register', { error: 'Email already registered.' });

    const user = await User.create({ name, email, mobile, password, role: 'customer' });
    req.session.user = { id: user._id, name: user.name, email: user.email, role: user.role };
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.render('register', { error: 'Something went wrong. Try again.' });
  }
};

// ---- SELLER REGISTRATION ----
exports.getSellerRegister = (req, res) => res.render('seller-register', { error: null });

exports.postSellerRegister = async (req, res) => {
  try {
    const { name, email, mobile, password, businessName, gstNumber, panNumber, businessAddress } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.render('seller-register', { error: 'Email already registered.' });

    const user = await User.create({
      name, email, mobile, password, role: 'seller',
      sellerProfile: { businessName, gstNumber, panNumber, businessAddress, status: 'pending' },
    });

    req.session.user = { id: user._id, name: user.name, email: user.email, role: user.role };
    res.redirect('/seller/pending');
  } catch (err) {
    console.error(err);
    res.render('seller-register', { error: 'Something went wrong. Try again.' });
  }
};

// ---- LOGIN with portal selection + lockout protection ----
exports.getLogin = (req, res) => {
  const portal = ['customer', 'seller', 'admin'].includes(req.query.portal) ? req.query.portal : 'customer';
  res.render('login', { error: null, portal });
};

exports.postLogin = async (req, res) => {
  try {
    const { email, password, portal } = req.body;
    const chosenPortal = ['customer', 'seller', 'admin'].includes(portal) ? portal : 'customer';
    
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.render('login', { error: 'Invalid email or password.', portal: chosenPortal });
    
    if (user.isBlocked) {
      return res.render('login', { error: 'Your account has been blocked. Contact support.', portal: chosenPortal });
    }
    
    if (user.isLocked) {
      return res.render('login', { error: 'Account temporarily locked due to too many failed attempts. Try again in 15 minutes.', portal: chosenPortal });
    }
    
    const match = await user.comparePassword(password);
    if (!match) {
      await user.incrementLoginAttempts();
      return res.render('login', { error: 'Invalid email or password.', portal: chosenPortal });
    }
    
    await user.resetLoginAttempts();
    
    // ---- Portal gate: make sure they're logging into the RIGHT door ----
    if (chosenPortal === 'seller' && user.role !== 'seller') {
      return res.render('login', { error: 'This account is not registered as a seller. Use the Customer or Admin tab instead.', portal: chosenPortal });
    }
    if (chosenPortal === 'admin' && !['admin', 'superadmin'].includes(user.role)) {
      return res.render('login', { error: 'This account does not have admin access.', portal: chosenPortal });
    }
    if (chosenPortal === 'customer' && user.role !== 'customer') {
      return res.render('login', {
        error: `This is a ${user.role} account. Please use the ${user.role === 'seller' ? 'Seller' : 'Admin'} tab to log in.`,
        portal: chosenPortal,
      });
    }
    
    // Update last login timestamp and IP
    user.lastLoginAt = new Date();
    user.lastLoginIp = req.ip;
    await user.save();

    req.session.user = { id: user._id, name: user.name, email: user.email, role: user.role };
    
    // Audit log for admin tier login
    if (ADMIN_TIER_ROLES.includes(user.role)) {
      await logAction(req, { action: `Admin login (${chosenPortal} portal)`, entity: 'User', entityId: user._id });
    }

    // Role-based redirect (actual role, not just chosen portal)
    if (user.role === 'seller') return res.redirect('/seller/dashboard');
    if (user.role === 'admin' || user.role === 'superadmin') return res.redirect('/admin/dashboard');
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.render('login', { error: 'Something went wrong. Try again.', portal: req.body.portal || 'customer' });
  }
};

exports.logout = async (req, res) => {
  const user = req.session.user;
  if (user && ADMIN_TIER_ROLES.includes(user.role)) {
    await logAction(req, { action: 'Admin logout', entity: 'User', entityId: user.id });
  }
  req.session.destroy(() => res.redirect('/'));
};

// ---- FORGOT PASSWORD ----
exports.getForgotPassword = (req, res) => res.render('forgot-password', { error: null, success: null });

exports.postForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always show the same message (prevents email enumeration)
    const successMsg = 'If that email exists in our system, a reset link has been sent.';
    if (!user) return res.render('forgot-password', { error: null, success: successMsg });

    const rawToken = user.generateResetToken();
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;

    await sendMail({
      to: user.email,
      subject: 'NOVA MARKET — Password Reset',
      html: `<p>Hi ${user.name},</p><p>Click below to reset your password (valid for 30 minutes):</p><a href="${resetUrl}">${resetUrl}</a>`,
    });

    console.log('🔗 Password reset link (for testing):', resetUrl);

    res.render('forgot-password', { error: null, success: successMsg });
  } catch (err) {
    console.error(err);
    res.render('forgot-password', { error: 'Something went wrong.', success: null });
  }
};

exports.getResetPassword = async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) return res.render('reset-password', { error: 'Reset link is invalid or has expired.', token: null });
  res.render('reset-password', { error: null, token: req.params.token });
};

exports.postResetPassword = async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return res.render('reset-password', { error: 'Reset link is invalid or has expired.', token: null });

    const { password, confirmPassword } = req.body;
    if (password !== confirmPassword) {
      return res.render('reset-password', { error: 'Passwords do not match.', token: req.params.token });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.render('reset-password', { error: 'Something went wrong.', token: req.params.token });
  }
};