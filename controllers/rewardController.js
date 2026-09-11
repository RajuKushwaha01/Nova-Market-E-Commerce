const Reward = require('../models/Reward');

// ₹100 spent = 1 point. Called after DELIVERED status (wire into sellerController.updateOrderItemStatus)
exports.earnPoints = async (userId, amount, orderId) => {
  const points = Math.floor(amount / 100);
  if (points <= 0) return;

  let reward = await Reward.findOne({ user: userId });
  if (!reward) reward = await Reward.create({ user: userId, balance: 0, history: [] });

  reward.balance += points;
  reward.history.push({ points, type: 'EARNED', reason: 'Order delivered', order: orderId });
  await reward.save();
};

exports.viewRewards = async (req, res) => {
  const reward = await Reward.findOne({ user: req.session.user.id });
  res.render('rewards', { reward: reward || { balance: 0, history: [] } });
};

// Called during checkout — returns max redeemable points capped at order value
exports.getRedeemableBalance = async (userId, orderValue) => {
  const reward = await Reward.findOne({ user: userId });
  if (!reward) return 0;
  return Math.min(reward.balance, Math.floor(orderValue * 0.1)); // cap: 10% of order value
};

exports.redeemPoints = async (userId, points, orderId) => {
  const reward = await Reward.findOne({ user: userId });
  if (!reward || reward.balance < points) return false;
  reward.balance -= points;
  reward.history.push({ points: -points, type: 'REDEEMED', reason: 'Used at checkout', order: orderId });
  await reward.save();
  return true;
};