const LeaveRequest = require('../models/LeaveRequest');
const Alert = require('../models/Alert');
const AuditLog = require('../models/AuditLog');

exports.getLeaves = async (req, res) => {
  try {
    const { status, worker, page = 1, limit = 20 } = req.query;
    const query = {};
    if (req.user.role === 'worker') query.worker = req.user._id;
    else if (worker) query.worker = worker;
    if (status) query.status = status;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [leaves, total] = await Promise.all([
      LeaveRequest.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit))
        .populate('worker', 'name userId department')
        .populate('reviewedBy', 'name userId'),
      LeaveRequest.countDocuments(query)
    ]);
    res.json({ success: true, count: leaves.length, total, pages: Math.ceil(total / parseInt(limit)), data: leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to load leave requests.' });
  }
};

exports.applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ success: false, message: 'End date cannot be before start date.' });
    }
    const leave = await LeaveRequest.create({
      worker: req.user._id, leaveType, startDate, endDate, reason, createdBy: req.user._id
    });
    // Notify supervisors
    await Alert.create({
      type: 'general', title: `New Leave Request: ${req.user.userId}`,
      message: `${req.user.name} has applied for ${leaveType} from ${new Date(startDate).toLocaleDateString('en-IN')} to ${new Date(endDate).toLocaleDateString('en-IN')}.`,
      severity: 'info', targetRole: 'supervisor', relatedModule: 'leave', relatedId: leave._id
    });
    res.status(201).json({ success: true, message: 'Leave request submitted.', data: leave });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to submit leave request.' });
  }
};

exports.reviewLeave = async (req, res) => {
  try {
    if (!['admin', 'supervisor'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only supervisors/admins can review leave requests.' });
    }
    const { status, reviewRemarks } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid review status.' });
    }
    const leave = await LeaveRequest.findById(req.params.id).populate('worker', 'name userId');
    if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found.' });
    if (leave.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'This leave request has already been reviewed.' });
    }
    leave.status = status;
    leave.reviewedBy = req.user._id;
    leave.reviewDate = new Date();
    leave.reviewRemarks = reviewRemarks;
    await leave.save();
    await Alert.create({
      type: 'general', title: `Leave Request ${status}: ${leave.leaveId}`,
      message: `Your leave request (${leave.leaveId}) has been ${status.toLowerCase()} by ${req.user.name}.`,
      severity: status === 'Approved' ? 'success' : 'warning', targetUser: leave.worker._id,
      relatedModule: 'leave', relatedId: leave._id
    });
    await AuditLog.create({
      user: req.user._id, userRole: req.user.role, action: `${status} Leave Request`,
      module: 'leave', recordId: leave.leaveId,
      description: `${req.user.name} ${status.toLowerCase()} leave for ${leave.worker.name}`
    });
    res.json({ success: true, message: `Leave ${status.toLowerCase()}.`, data: leave });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to process leave review.' });
  }
};
