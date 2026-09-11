const SupportTicket = require('../models/SupportTicket');
const { notify } = require('./notificationController');

// ---------- CUSTOMER ----------
exports.myTickets = async (req, res) => {
  const tickets = await SupportTicket.find({ user: req.session.user.id }).sort({ createdAt: -1 });
  res.render('support-tickets', { tickets });
};

exports.createTicket = async (req, res) => {
  const { subject, category, relatedOrder, message } = req.body;
  await SupportTicket.create({
    user: req.session.user.id, subject, category, relatedOrder: relatedOrder || undefined,
    messages: [{ sender: req.session.user.id, senderRole: 'customer', text: message }],
  });
  res.redirect('/support/tickets');
};

exports.viewTicket = async (req, res) => {
  const ticket = await SupportTicket.findOne({ _id: req.params.id, user: req.session.user.id }).populate('messages.sender', 'name role');
  if (!ticket) return res.redirect('/support/tickets');
  res.render('ticket-details', { ticket, isAdmin: false });
};

exports.replyAsCustomer = async (req, res) => {
  const ticket = await SupportTicket.findOne({ _id: req.params.id, user: req.session.user.id });
  if (ticket) {
    ticket.messages.push({ sender: req.session.user.id, senderRole: 'customer', text: req.body.message });
    if (ticket.status === 'RESOLVED') ticket.status = 'IN_PROGRESS';
    await ticket.save();
  }
  res.redirect(`/support/tickets/${req.params.id}`);
};

// ---------- ADMIN / SUPPORT AGENT ----------
exports.adminList = async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const tickets = await SupportTicket.find(filter).populate('user', 'name email').sort({ createdAt: -1 });
  res.render('admin/support', { tickets, activeStatus: status || '' });
};

exports.adminViewTicket = async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id).populate('user', 'name email').populate('messages.sender', 'name role');
  res.render('ticket-details', { ticket, isAdmin: true });
};

exports.adminReply = async (req, res) => {
  const { message, status } = req.body;
  const ticket = await SupportTicket.findById(req.params.id);
  if (message) {
    ticket.messages.push({ sender: req.session.user.id, senderRole: req.session.user.role === 'admin' ? 'admin' : 'support', text: message });
  }
  if (status) ticket.status = status;
  await ticket.save();

  await notify(ticket.user, 'SUPPORT', 'Support Ticket Updated', `Your ticket "${ticket.subject}" has a new update.`, `/support/tickets/${ticket._id}`);

  res.redirect(`/admin/support/${req.params.id}`);
};