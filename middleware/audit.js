const AuditLog = require('../models/AuditLog');

// Call this from any admin action: await logAction(req, { action, entity, entityId, oldValue, newValue })
exports.logAction = async (req, { action, entity, entityId, oldValue, newValue }) => {
  try {
    await AuditLog.create({
      user: req.session.user.id,
      userName: req.session.user.name,
      action, entity, entityId, oldValue, newValue,
      ip: req.ip,
    });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
};