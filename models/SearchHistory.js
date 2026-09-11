const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  query: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('SearchHistory', searchHistorySchema);