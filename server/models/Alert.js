const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  alertId: { type: String, unique: true, required: true },
  type: {
    type: String,
    required: true,
    enum: [
      'task_not_seen',
      'task_overdue',
      'task_due_soon',
      'task_assigned',
      'maintenance_due',
      'maintenance_overdue',
      'tyre_alert',
      'tyre_critical',
      'cost_mismatch',
      'pending_verification',
      'worker_unavailable',
      'issue_reported',
      'bill_pending',
      'leave_conflict',
      'general'
    ]
  },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  priority: {
    type: String,
    enum: ['Critical', 'High', 'Medium', 'Low'],
    default: 'Medium'
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical', 'success', 'Low', 'Medium', 'High', 'Critical'],
    default: 'info'
  },
  status: {
    type: String,
    enum: ['Active', 'Acknowledged', 'Resolved'],
    default: 'Active'
  },
  targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  targetRole: { type: String, enum: ['admin', 'supervisor', 'worker', 'all'], default: 'all' },
  relatedModule: {
    type: String,
    enum: ['equipment', 'tyre', 'maintenance', 'task', 'bill', 'leave', 'attendance', 'issue', 'general']
  },
  relatedId: { type: mongoose.Schema.Types.ObjectId },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

alertSchema.pre('validate', async function(next) {
  if (!this.alertId) {
    this.alertId = `ALT-${Date.now().toString().slice(-5)}${Math.floor(100 + Math.random() * 900)}`;
  }
  // Sync priority with severity
  if (this.priority && !this.severity) {
    this.severity = this.priority.toLowerCase();
  }
  next();
});

module.exports = mongoose.model('Alert', alertSchema);
