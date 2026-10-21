const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
  auditId: { type: String, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userRole: { type: String, required: true },
  action: { type: String, required: true, trim: true },
  module: { type: String, required: true,
    enum: ['auth', 'users', 'equipment', 'tyre', 'maintenance', 'task', 'issue', 'alert', 'attendance', 'leave', 'bill', 'reports', 'settings', 'general'] },
  recordId: { type: String },
  description: { type: String, trim: true },
  previousValue: { type: mongoose.Schema.Types.Mixed },
  newValue: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String }
}, { timestamps: true });

auditSchema.pre('validate', async function(next) {
  if (!this.auditId) {
    const timestamp = Date.now().toString().slice(-6);
    const rand = Math.floor(1000 + Math.random() * 9000);
    this.auditId = `AUD-${timestamp}${rand}`;
  }
  next();
});

module.exports = mongoose.model('AuditLog', auditSchema);
