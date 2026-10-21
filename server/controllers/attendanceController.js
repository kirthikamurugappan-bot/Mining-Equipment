const Attendance = require('../models/Attendance');
const User = require('../models/User');
const LeaveRequest = require('../models/LeaveRequest');
const AuditLog = require('../models/AuditLog');

const startOfDay = (d) => { const dt = new Date(d); dt.setHours(0,0,0,0); return dt; };
const endOfDay = (d) => { const dt = new Date(d); dt.setHours(23,59,59,999); return dt; };

// @desc    Get attendance records (Role-scoped)
// @route   GET /api/attendance
// @access  Private (Worker, Supervisor, Admin)
exports.getAttendance = async (req, res) => {
  try {
    const { user: targetUserId, worker, role, status, startDate, endDate, page = 1, limit = 50 } = req.query;
    const query = {};

    // 1. Role Scoping
    if (req.user.role === 'worker') {
      // Workers only see their own attendance
      query.user = req.user._id;
    } else if (req.user.role === 'supervisor') {
      // Supervisors can filter by a specific worker, or view their own, or all workers
      if (targetUserId) {
        query.user = targetUserId;
      } else if (worker) {
        query.user = worker;
      } else if (role) {
        query.userRole = role;
      }
    } else {
      // Admin: Broadest access across whole organization
      if (targetUserId) {
        query.user = targetUserId;
      } else if (worker) {
        query.user = worker;
      } else if (role) {
        query.userRole = role;
      }
    }

    if (status) query.status = status;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startOfDay(startDate);
      if (endDate) query.date.$lte = endOfDay(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [records, total] = await Promise.all([
      Attendance.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('user', 'name userId employeeId role department designation availability phone')
        .populate('markedBy', 'name userId'),
      Attendance.countDocuments(query)
    ]);

    res.json({
      success: true,
      count: records.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      data: records
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ success: false, message: 'Unable to load attendance records.' });
  }
};

// @desc    Check In (Worker, Supervisor, Admin)
// @route   POST /api/attendance/checkin
// @access  Private
exports.checkIn = async (req, res) => {
  try {
    const today = startOfDay(new Date());
    const now = new Date();

    // Check if user already checked in today
    let record = await Attendance.findOne({
      $or: [
        { user: req.user._id, date: today },
        { worker: req.user._id, date: today }
      ]
    });

    if (record && record.checkIn) {
      return res.status(400).json({
        success: false,
        message: `You have already checked in today at ${new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
      });
    }

    // Determine status: If check in after 9:30 AM, mark as Late, otherwise Present
    const hour = now.getHours();
    const minute = now.getMinutes();
    const isLate = hour > 9 || (hour === 9 && minute > 30);
    const initialStatus = isLate ? 'Late' : 'Present';

    if (!record) {
      record = await Attendance.create({
        user: req.user._id,
        worker: req.user._id,
        employeeId: req.user.employeeId || req.user.userId,
        userRole: req.user.role,
        department: req.user.department || 'Operations',
        date: today,
        checkIn: now,
        status: initialStatus,
        remarks: req.body.remarks || (isLate ? 'Checked in after 09:30 AM' : 'On-time check in'),
        markedBy: req.user._id
      });
    } else {
      record.checkIn = now;
      record.status = initialStatus;
      if (req.body.remarks) record.remarks = req.body.remarks;
      await record.save();
    }

    // Update user availability to Available if they were marked offline
    if (req.user.availability === 'On Leave') {
      // Keep on leave if approved
    } else {
      await User.findByIdAndUpdate(req.user._id, { availability: 'Available' });
    }

    await AuditLog.create({
      user: req.user._id,
      userRole: req.user.role,
      action: 'Check In',
      module: 'attendance',
      description: `${req.user.name} (${req.user.role}) checked in at ${now.toLocaleTimeString()}`
    });

    res.json({
      success: true,
      message: `Check-in recorded successfully as ${initialStatus}.`,
      data: record
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ success: false, message: 'Check-in failed. Please try again.' });
  }
};

// @desc    Check Out (Worker, Supervisor, Admin)
// @route   POST /api/attendance/checkout
// @access  Private
exports.checkOut = async (req, res) => {
  try {
    const today = startOfDay(new Date());
    const now = new Date();

    const record = await Attendance.findOne({
      $or: [
        { user: req.user._id, date: today },
        { worker: req.user._id, date: today }
      ]
    });

    if (!record || !record.checkIn) {
      return res.status(400).json({
        success: false,
        message: 'No active check-in found for today. You must check in before checking out.'
      });
    }

    if (record.checkOut) {
      return res.status(400).json({
        success: false,
        message: `You have already checked out today at ${new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
      });
    }

    record.checkOut = now;
    if (req.body.remarks) {
      record.remarks = record.remarks ? `${record.remarks} | Out: ${req.body.remarks}` : req.body.remarks;
    }
    await record.save();

    await AuditLog.create({
      user: req.user._id,
      userRole: req.user.role,
      action: 'Check Out',
      module: 'attendance',
      description: `${req.user.name} (${req.user.role}) checked out at ${now.toLocaleTimeString()} (${record.hoursWorked}h logged)`
    });

    res.json({
      success: true,
      message: `Check-out recorded. Hours logged: ${record.hoursWorked} hrs.`,
      data: record
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ success: false, message: 'Check-out failed. Please try again.' });
  }
};

// @desc    Get Today's status for the logged-in user
// @route   GET /api/attendance/today
// @access  Private
exports.getTodayStatus = async (req, res) => {
  try {
    const today = startOfDay(new Date());
    const record = await Attendance.findOne({
      $or: [
        { user: req.user._id, date: today },
        { worker: req.user._id, date: today }
      ]
    }).populate('user', 'name userId employeeId role department availability');

    // Also get active leave status if any
    const activeLeave = await LeaveRequest.findOne({
      worker: req.user._id,
      status: 'Approved',
      startDate: { $lte: new Date() },
      endDate: { $gte: startOfDay(new Date()) }
    });

    res.json({
      success: true,
      data: record || null,
      activeLeave: activeLeave || null
    });
  } catch (error) {
    console.error('Get today status error:', error);
    res.status(500).json({ success: false, message: 'Unable to get attendance status.' });
  }
};

// @desc    Get Organization-wide / Supervisor Attendance Analytics
// @route   GET /api/attendance/analytics
// @access  Private (Supervisor, Admin)
exports.getAnalytics = async (req, res) => {
  try {
    const today = startOfDay(new Date());

    // Get all users in workforce
    const allUsers = await User.find({ isActive: true }, 'name role department availability employeeId');
    const todayRecords = await Attendance.find({ date: today }).populate('user', 'name role department');

    const presentCount = todayRecords.filter(r => ['Present', 'Late'].includes(r.status)).length;
    const lateCount = todayRecords.filter(r => r.status === 'Late').length;
    const leaveCount = allUsers.filter(u => u.availability === 'On Leave').length;
    const totalWorkforce = allUsers.length;
    const absentCount = Math.max(0, totalWorkforce - presentCount - leaveCount);

    // Grouping by role
    const roleStats = {
      worker: { total: allUsers.filter(u => u.role === 'worker').length, present: 0 },
      supervisor: { total: allUsers.filter(u => u.role === 'supervisor').length, present: 0 },
      admin: { total: allUsers.filter(u => u.role === 'admin').length, present: 0 }
    };

    todayRecords.forEach(r => {
      const uRole = r.user?.role || r.userRole;
      if (roleStats[uRole] && ['Present', 'Late'].includes(r.status)) {
        roleStats[uRole].present += 1;
      }
    });

    res.json({
      success: true,
      data: {
        totalWorkforce,
        presentCount,
        lateCount,
        leaveCount,
        absentCount,
        roleStats
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ success: false, message: 'Unable to load attendance analytics.' });
  }
};
