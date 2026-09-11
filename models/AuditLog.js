const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: String,
  action: { type: String, required: true },   // e.g. "Changed product price"
  entity: { type: String, required: true },   // e.g. "Product"
  entityId: { type: mongoose.Schema.Types.ObjectId },
  oldValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  ip: String,
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);