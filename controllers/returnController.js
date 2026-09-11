const Order = require('../models/Order');

exports.requestReturn = async (req, res) => {
  const { orderId, itemId } = req.params;
  const { reason, details, type, images } = req.body;

  const order = await Order.findOne({ _id: orderId, user: req.session.user.id });
  if (!order) return res.redirect('/orders');

  const item = order.items.id(itemId);
  if (item && item.status === 'DELIVERED') {
    item.status = 'RETURN_REQUESTED';
    item.statusHistory.push({ status: 'RETURN_REQUESTED' });
    item.returnInfo = {
      reason, details, type: type || 'RETURN',
      images: images ? images.split(',').map((s) => s.trim()).filter(Boolean) : [],
      status: 'REQUESTED',
      refundStatus: order.paymentMethod === 'Online' ? 'REQUESTED' : 'NOT_APPLICABLE',
      requestedAt: new Date(),
    };
  }

  await order.save();
  res.redirect(`/orders/${orderId}`);
};

// Wired to Seller/Admin dashboards in later parts
exports.updateReturnStatus = async (req, res) => {
  const { orderId, itemId } = req.params;
  const { status } = req.body; // APPROVED, REJECTED, PICKED_UP, REFUNDED

  const order = await Order.findById(orderId);
  const item = order.items.id(itemId);
  if (!item || !item.returnInfo) return res.redirect('back');

  item.returnInfo.status = status;
  if (status === 'REJECTED') item.status = 'DELIVERED';
  if (status === 'PICKED_UP') item.status = 'RETURNED';
  if (status === 'REFUNDED') {
    item.status = 'REFUNDED';
    item.returnInfo.refundStatus = 'COMPLETED';
  }

  item.statusHistory.push({ status: item.status });
  await order.save();
  res.redirect('back');
};