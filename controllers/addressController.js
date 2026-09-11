const Address = require('../models/Address');
const { asyncHandler } = require('../middleware/errorHandler');

exports.listAddresses = asyncHandler(async (req, res) => {
  const addresses = await Address.find({ user: req.session.user.id }).sort({ isDefault: -1, createdAt: -1 });
  res.render('addresses', { addresses });
});

exports.newAddressForm = (req, res) => res.render('address-form', { address: null });

exports.editAddressForm = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ _id: req.params.id, user: req.session.user.id });
  if (!address) return res.redirect('/addresses');
  res.render('address-form', { address });
});

// Only whitelisted fields are saved — stray fields like _csrf from the hidden input never reach the DB call
exports.createAddress = asyncHandler(async (req, res) => {
  const { fullName, mobile, houseNumber, street, area, city, state, pincode, landmark, addressType, isDefault } = req.body;

  const data = {
    user: req.session.user.id,
    fullName, mobile, houseNumber, street, area, city, state, pincode, landmark,
    addressType: addressType || 'Home',
  };

  if (isDefault === 'on') {
    await Address.updateMany({ user: req.session.user.id }, { isDefault: false });
    data.isDefault = true;
  } else {
    data.isDefault = false;
  }

  await Address.create(data);
  res.redirect('/addresses');
});

exports.updateAddress = asyncHandler(async (req, res) => {
  const { fullName, mobile, houseNumber, street, area, city, state, pincode, landmark, addressType, isDefault } = req.body;

  const data = { fullName, mobile, houseNumber, street, area, city, state, pincode, landmark, addressType: addressType || 'Home' };

  if (isDefault === 'on') {
    await Address.updateMany({ user: req.session.user.id }, { isDefault: false });
    data.isDefault = true;
  } else {
    data.isDefault = false;
  }

  await Address.findOneAndUpdate({ _id: req.params.id, user: req.session.user.id }, data);
  res.redirect('/addresses');
});

exports.deleteAddress = asyncHandler(async (req, res) => {
  await Address.findOneAndDelete({ _id: req.params.id, user: req.session.user.id });
  res.redirect('/addresses');
});

exports.setDefault = asyncHandler(async (req, res) => {
  await Address.updateMany({ user: req.session.user.id }, { isDefault: false });
  await Address.findOneAndUpdate({ _id: req.params.id, user: req.session.user.id }, { isDefault: true });
  res.redirect('/addresses');
});