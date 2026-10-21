const Alert = require('../models/Alert');

exports.getAlerts = async (req, res) => {
  try {
    const { isRead, status, priority, type, severity, page = 1, limit = 50 } = req.query;
    const query = { isActive: true };
    // Show alerts for this user or their role or 'all'
    query.$or = [
      { targetUser: req.user._id },
      { targetRole: req.user.role },
      { targetRole: 'all' }
    ];
    if (isRead !== undefined) query.isRead = isRead === 'true';
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (type) query.type = type;
    if (severity) query.severity = severity;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [alerts, total, unreadCount] = await Promise.all([
      Alert.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Alert.countDocuments(query),
      Alert.countDocuments({ ...query, isRead: false })
    ]);
    res.json({ success: true, count: alerts.length, total, unreadCount, pages: Math.ceil(total / parseInt(limit)), data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to load alerts.' });
  }
};

exports.markRead = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found.' });
    alert.isRead = true;
    alert.readAt = new Date();
    await alert.save();
    res.json({ success: true, message: 'Alert marked as read.', data: alert });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to mark alert.' });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await Alert.updateMany(
      { $or: [{ targetUser: req.user._id }, { targetRole: req.user.role }, { targetRole: 'all' }], isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
    res.json({ success: true, message: 'All alerts marked as read.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to mark alerts.' });
  }
};

exports.updateAlertStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const alert = await Alert.findById(req.params.id);
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found.' });

    if (['Active', 'Acknowledged', 'Resolved'].includes(status)) {
      alert.status = status;
      if (status === 'Resolved' || status === 'Acknowledged') {
        alert.isRead = true;
        alert.readAt = new Date();
      }
      await alert.save();
      return res.json({ success: true, message: `Alert status updated to ${status}.`, data: alert });
    }
    res.status(400).json({ success: false, message: 'Invalid alert status.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to update alert status.' });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Alert.countDocuments({
      $or: [{ targetUser: req.user._id }, { targetRole: req.user.role }, { targetRole: 'all' }],
      isRead: false, isActive: true
    });
    res.json({ success: true, unreadCount: count });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to get alert count.' });
  }
};
