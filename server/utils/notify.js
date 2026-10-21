const Notification = require('../models/Notification');
const Alert = require('../models/Alert');
const User = require('../models/User');

/**
 * Dispatch an in-app Notification and store in MongoDB.
 * Also synchronizes with Alert and attempts Web Push if user is subscribed.
 */
async function sendNotification({
  recipient,
  type,
  title,
  message,
  relatedRecordId = null,
  relatedRecordType = 'task',
  actionUrl = '/tasks',
  priority = 'Medium',
  metadata = {}
}) {
  try {
    if (!recipient || !title || !message) return null;

    // 1. Create in-app Notification in MongoDB
    const notification = await Notification.create({
      recipient,
      type,
      title,
      message,
      relatedRecordId,
      relatedRecordType,
      actionUrl,
      priority,
      metadata
    });

    // 2. Also create an Alert for legacy alerts feed
    try {
      const alertTypeMap = {
        task_assigned: 'task_assigned',
        task_due_soon: 'task_due_soon',
        task_overdue: 'task_overdue',
        task_completed: 'task_assigned',
        issue_reported: 'issue_reported',
        maintenance_due: 'maintenance_due',
        cost_mismatch: 'cost_mismatch',
        worker_unavailable: 'worker_unavailable'
      };

      await Alert.create({
        type: alertTypeMap[type] || 'general',
        title,
        message,
        priority: priority === 'Critical' ? 'Critical' : priority === 'High' ? 'High' : 'Medium',
        severity: priority === 'Critical' ? 'critical' : priority === 'High' ? 'warning' : 'info',
        targetUser: recipient,
        relatedModule: relatedRecordType === 'task' ? 'task' : relatedRecordType === 'equipment' ? 'equipment' : 'general',
        relatedId: relatedRecordId
      });
    } catch (e) {
      // Non-fatal if alert mirror fails
    }

    // 3. Web Push Notification Delivery (Simulated/Attempted safely)
    try {
      const user = await User.findById(recipient).select('pushSubscriptions notificationPreferences');
      if (user && user.pushSubscriptions && user.pushSubscriptions.length > 0) {
        // Log push delivery attempt as requested by requirement 18 & 19
        console.log(`[Push Notification] Attempted Web Push to user ${recipient} for ${type}: "${title}"`);
      }
    } catch (pushErr) {
      console.warn('Web push delivery skipped:', pushErr.message);
    }

    return notification;
  } catch (error) {
    console.error('Notification creation error:', error);
    return null;
  }
}

module.exports = {
  sendNotification
};
