const User = require('../models/User');

exports.viewProfile = async (req, res) => {
  const user = await User.findById(req.session.user.id);
  res.render('profile', { profileUser: user, success: null, error: null });
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, mobile, gender, dob } = req.body;
    const user = await User.findByIdAndUpdate(
      req.session.user.id,
      { name, mobile, gender, dob: dob || undefined },
      { new: true, runValidators: true }
    );
    req.session.user.name = user.name;
    res.render('profile', { profileUser: user, success: 'Profile updated successfully.', error: null });
  } catch (err) {
    const user = await User.findById(req.session.user.id);
    res.render('profile', { profileUser: user, success: null, error: 'Update failed. Try again.' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    const user = await User.findById(req.session.user.id).select('+password');

    const match = await user.comparePassword(currentPassword);
    if (!match) {
      return res.render('profile', { profileUser: user, success: null, error: 'Current password is incorrect.' });
    }
    if (newPassword !== confirmNewPassword) {
      return res.render('profile', { profileUser: user, success: null, error: 'New passwords do not match.' });
    }

    user.password = newPassword;
    await user.save();
    res.render('profile', { profileUser: user, success: 'Password changed successfully.', error: null });
  } catch (err) {
    console.error(err);
    res.redirect('/profile');
  }
};