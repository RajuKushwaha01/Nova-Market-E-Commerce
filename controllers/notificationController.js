const Notification = require('../models/Notification');
const User = require('../models/User');
const { logAction } = require('../middleware/audit');

// Core helper used across the whole app to push a notification (called from order/return/coupon flows)
exports.notify = async (userId, type, title, message, link = '/orders') => {
  try {
    await Notification.create({ user: userId, type, title, message, link });
  } catch (err) {
    console.error('Notification failed:', err.message);
  }
};

exports.list = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.session.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.render('notifications', { notifications });
  } catch (err) {
    next(err);
  }
};

exports.unreadCount = async (userId) => {
  return Notification.countDocuments({ user: userId, isRead: false });
};

exports.markRead = async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.session.user.id },
      { isRead: true }
    );
    res.redirect(req.get('Referrer') || '/notifications');
  } catch (err) {
    next(err);
  }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.session.user.id },
      { isRead: true }
    );
    res.redirect(req.get('Referrer') || '/notifications');
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.session.user.id
    });
    res.redirect(req.get('Referrer') || '/notifications');
  } catch (err) {
    next(err);
  }
};

// ---------- ADMIN: platform-wide notification broadcast (spec section 21) ----------
exports.broadcastForm = (req, res) =>
  res.render('admin/notifications-broadcast', { result: null });

exports.broadcast = async (req, res, next) => {
  try {
    const { target, title, message, link } = req.body;
    let filter = {};
    if (target === 'customers') filter = { role: 'customer' };
    else if (target === 'sellers')
      filter = { role: 'seller', 'sellerProfile.status': 'approved' };
    // target === 'all' → no filter, hits every user

    const users = await User.find(filter).select('_id');
    if (users.length > 0) {
      await Notification.insertMany(
        users.map((u) => ({
          user: u._id,
          type: 'OFFER',
          title,
          message,
          link: link || '/'
        }))
      );
    }

    await logAction(req, {
      action: 'Sent broadcast notification',
      entity: 'Notification',
      newValue: { target, title, recipientCount: users.length }
    });

    res.render('admin/notifications-broadcast', {
      result: `Sent to ${users.length} user(s).`
    });
  } catch (err) {
    next(err);
  }
};