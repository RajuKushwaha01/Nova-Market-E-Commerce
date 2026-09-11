const Question = require('../models/Question');

exports.getProductQuestions = async (productId) => {
  return Question.find({ product: productId, isReported: false })
    .populate('askedBy', 'name')
    .sort({ helpfulCount: -1, createdAt: -1 })
    .limit(20);
};

exports.ask = async (req, res, next) => {
  try {
    const { productId, text } = req.body;
    await Question.create({ product: productId, askedBy: req.session.user.id, text });
    res.redirect(`/product/${productId}#questions`);
  } catch (err) {
    next(err);
  }
};

// Seller or admin answering
exports.answer = async (req, res, next) => {
  try {
    const { text } = req.body;
    const question = await Question.findById(req.params.id);
    if (!question) return res.redirect(req.get('Referrer') || '/');

    question.answers.push({
      answeredBy: req.session.user.id,
      answererRole: req.session.user.role === 'admin' ? 'admin' : 'seller',
      text,
    });
    await question.save();
    res.redirect(`/product/${question.product}#questions`);
  } catch (err) {
    next(err);
  }
};

exports.markHelpful = async (req, res, next) => {
  try {
    await Question.findByIdAndUpdate(req.params.id, { $inc: { helpfulCount: 1 } });
    res.redirect(req.get('Referrer') || '/');
  } catch (err) {
    next(err);
  }
};

exports.report = async (req, res, next) => {
  try {
    await Question.findByIdAndUpdate(req.params.id, { isReported: true });
    res.redirect(req.get('Referrer') || '/');
  } catch (err) {
    next(err);
  }
};