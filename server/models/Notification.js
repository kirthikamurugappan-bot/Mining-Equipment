const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  notificationId: {
    type: String,
    unique: true,
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'task_assigned',
      'task_due_soon',
      'task_overdue',
      'task_reassigned',
      'task_rescheduled',
      'task_acknowledged',
      'task_started',
      'task_completed',
      'issue_reported',
      'issue_updated',
      'maintenance_due',
      'maintenance_completed',
      'cost_mismatch',
      'worker_unavailable',
      'attendance_alert',
      'system_alert',
      'general'
    ]
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  relatedRecordId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  relatedRecordType: {
    type: String,
    enum: ['task', 'equipment', 'maintenance', 'issue', 'attendance', 'bill', 'alert', 'leave', 'system', 'general'],
    default: 'task'
  },
  actionUrl: {
    type: String,
    default: '/tasks'
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

// Auto-generate notificationId
notificationSchema.pre('validate', async function(next) {
  if (!this.notificationId) {
    const timestamp = Date.now().toString().slice(-6);
    const rand = Math.floor(100 + Math.random() * 900);
    this.notificationId = `NTF-${timestamp}${rand}`;
  }
  next();
});

module.exports = mongoose.model('Notification', notificationSchema);
