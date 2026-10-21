const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Get current user's notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const { isRead, type, page = 1, limit = 50 } = req.query;
    const query = { recipient: req.user._id };

    if (isRead !== undefined && isRead !== '') {
      query.isRead = isRead === 'true';
    }
    if (type) {
      query.type = type;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments(query),
      Notification.countDocuments({ recipient: req.user._id, isRead: false })
    ]);

    res.json({
      success: true,
      count: notifications.length,
      total,
      unreadCount,
      pages: Math.ceil(total / parseInt(limit)),
      data: notifications
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Unable to retrieve notifications.' });
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to get notification count.' });
  }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });

    res.json({ success: true, message: 'Notification marked as read.', data: notification, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
};

// @desc    Mark all user notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    res.json({ success: true, message: 'All notifications marked as read.', unreadCount: 0 });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark all as read.' });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });

    res.json({ success: true, message: 'Notification removed.', unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete notification.' });
  }
};

// @desc    Register Web Push Subscription
// @route   POST /api/notifications/subscribe-push
// @access  Private
exports.subscribePush = async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ success: false, message: 'Invalid subscription object.' });
    }

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { pushSubscriptions: { endpoint: subscription.endpoint } }
    });

    await User.findByIdAndUpdate(req.user._id, {
      $push: {
        pushSubscriptions: {
          endpoint: subscription.endpoint,
          keys: subscription.keys || {},
          subscribedAt: new Date()
        }
      }
    });

    res.json({ success: true, message: 'Push subscription registered successfully.' });
  } catch (error) {
    console.error('Push subscribe error:', error);
    res.status(500).json({ success: false, message: 'Failed to register push subscription.' });
  }
};

// @desc    Send test push/in-app notification
// @route   POST /api/notifications/test
// @access  Private
exports.sendTestNotification = async (req, res) => {
  try {
    const testNotif = await Notification.create({
      recipient: req.user._id,
      type: 'system_alert',
      title: 'MineTrack Test Notification',
      message: 'This is a test notification verifying your real-time notification channel.',
      priority: 'Low',
      actionUrl: '/notifications'
    });

    res.json({ success: true, message: 'Test notification created.', data: testNotif });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create test notification.' });
  }
};
