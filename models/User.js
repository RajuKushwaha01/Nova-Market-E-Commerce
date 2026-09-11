const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const addressRefSchema = new mongoose.Schema({}, { strict: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  mobile: { type: String, trim: true },
  password: { type: String, required: true, select: false },

  role: {
    type: String,
    enum: [
      'customer', 'seller', 'admin', 'support', 'superadmin', 'delivery',
      'product_manager', 'order_manager', 'finance_manager', 'support_manager',
    ],
    default: 'customer',
  },

  gender: { type: String, enum: ['Male', 'Female', 'Other', ''], default: '' },
  dob: { type: Date },
  profilePhoto: { type: String, default: '' },

  isVerified: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },

  // Seller-only fields
  sellerProfile: {
    businessName: String,
    gstNumber: String,
    panNumber: String,
    businessAddress: String,
    status: { type: String, enum: ['pending', 'approved', 'suspended', 'rejected'], default: 'pending' },
    bankInfo: {
      accountHolder: String,
      accountNumber: String,
      ifsc: String,
      bankName: String,
    },
  },

  // Security & Tracking
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  lastLoginAt: { type: Date },
  lastLoginIp: { type: String },

}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Account lock helpers
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.methods.incrementLoginAttempts = async function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    this.loginAttempts = 1;
    this.lockUntil = undefined;
  } else {
    this.loginAttempts += 1;
    if (this.loginAttempts >= 5) {
      this.lockUntil = Date.now() + 15 * 60 * 1000; // 15 min lock
    }
  }
  await this.save();
};

userSchema.methods.resetLoginAttempts = async function () {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  await this.save();
};

userSchema.methods.generateResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  this.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 min
  return rawToken;
};

module.exports = mongoose.model('User', userSchema);