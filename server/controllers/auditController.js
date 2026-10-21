const AuditLog = require('../models/AuditLog');

exports.getAuditLogs = async (req, res) => {
  try {
    const { module, user, action, startDate, endDate, page = 1, limit = 30 } = req.query;
    const query = {};
    if (module) query.module = module;
    if (user) query.user = user;
    if (action) query.action = { $regex: action, $options: 'i' };
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit))
        .populate('user', 'name userId role'),
      AuditLog.countDocuments(query)
    ]);
    res.json({ success: true, count: logs.length, total, pages: Math.ceil(total / parseInt(limit)), data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to load audit logs.' });
  }
};
