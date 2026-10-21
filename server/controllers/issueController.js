const Issue = require('../models/Issue');
const Equipment = require('../models/Equipment');
const Alert = require('../models/Alert');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const { sendNotification } = require('../utils/notify');

// @desc    Get all issues
// @route   GET /api/issues
exports.getIssues = async (req, res) => {
  try {
    const { status, priority, equipment, search, page = 1, limit = 20 } = req.query;
    const query = { isActive: true };

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (equipment) query.equipment = equipment;

    // Workers only see their own reported issues
    if (req.user.role === 'worker') {
      query.reportedBy = req.user._id;
    }

    if (search) {
      query.$or = [
        { issueId: { $regex: search, $options: 'i' } },
        { issueType: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [issues, total] = await Promise.all([
      Issue.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('equipment', 'equipmentId name type status location site')
        .populate('reportedBy', 'name userId username role')
        .populate('reviewedBy', 'name userId username')
        .populate('relatedMaintenance', 'maintenanceId status scheduledDate'),
      Issue.countDocuments(query)
    ]);

    res.json({
      success: true,
      count: issues.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      data: issues
    });
  } catch (error) {
    console.error('Get issues error:', error);
    res.status(500).json({ success: false, message: 'Unable to retrieve issues.' });
  }
};

// @desc    Get single issue
// @route   GET /api/issues/:id
exports.getIssueById = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('equipment', 'equipmentId name type status location site serialNumber model')
      .populate('reportedBy', 'name userId username email phone')
      .populate('reviewedBy', 'name userId username')
      .populate('relatedMaintenance', 'maintenanceId status scheduledDate totalCost');

    if (!issue || !issue.isActive) {
      return res.status(404).json({ success: false, message: 'Issue not found.' });
    }

    if (req.user.role === 'worker' && issue.reportedBy?._id?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, data: issue });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to retrieve issue details.' });
  }
};

// @desc    Report new issue (Worker / Supervisor / Admin)
// @route   POST /api/issues
exports.reportIssue = async (req, res) => {
  try {
    const { equipment, issueType, description, priority, photo, date } = req.body;
    if (!equipment || !description) {
      return res.status(400).json({ success: false, message: 'Equipment and description are required.' });
    }

    const eq = await Equipment.findById(equipment);
    if (!eq) {
      return res.status(404).json({ success: false, message: 'Equipment not found.' });
    }

    const issue = await Issue.create({
      equipment,
      reportedBy: req.user._id,
      issueType: issueType || 'Other',
      description,
      priority: priority || 'Medium',
      photo: photo || (req.file ? `/uploads/${req.file.filename}` : undefined),
      date: date || new Date(),
      status: 'Reported'
    });

    // Notify Supervisor with an Alert
    const severityMap = {
      Critical: 'critical',
      High: 'warning',
      Medium: 'info',
      Low: 'info'
    };

    await Alert.create({
      type: 'issue_reported',
      title: `Fault Reported: ${eq.name} (${issue.issueId})`,
      message: `${req.user.name} reported a ${issue.priority} priority issue on ${eq.name} (${eq.equipmentId}): "${issue.description.substring(0, 80)}"`,
      priority: issue.priority,
      severity: severityMap[issue.priority] || 'warning',
      targetRole: 'supervisor',
      relatedModule: 'issue',
      relatedId: issue._id,
      createdBy: req.user._id
    });

    // Notify all active supervisors
    try {
      const supervisors = await User.find({ role: { $in: ['supervisor', 'admin'] }, isActive: true });
      for (const sup of supervisors) {
        await sendNotification({
          recipient: sup._id,
          type: 'issue_reported',
          title: `Equipment Fault: ${eq.name} (${issue.issueId})`,
          message: `${req.user.name} reported ${issue.priority} priority fault: "${issue.description.substring(0, 75)}" on ${eq.name}`,
          priority: issue.priority,
          relatedRecordId: issue._id,
          relatedRecordType: 'issue',
          actionUrl: '/issues'
        });
      }
    } catch (e) {
      // Non-fatal
    }

    await AuditLog.create({
      user: req.user._id,
      userRole: req.user.role,
      action: 'Report Fault Issue',
      module: 'issue',
      recordId: issue.issueId,
      description: `${req.user.name} reported issue ${issue.issueId} on ${eq.name}`
    });

    const populated = await Issue.findById(issue._id)
      .populate('equipment', 'equipmentId name type status location')
      .populate('reportedBy', 'name userId');

    res.status(201).json({
      success: true,
      message: 'Equipment issue reported successfully. Supervisor alerted.',
      data: populated
    });
  } catch (error) {
    console.error('Report issue error:', error);
    res.status(500).json({ success: false, message: 'Unable to report issue. Please try again.' });
  }
};

// @desc    Supervisor triage/review issue
// @route   PUT /api/issues/:id/review
exports.reviewIssue = async (req, res) => {
  try {
    if (!['admin', 'supervisor'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only supervisors and admins can review issues.' });
    }

    const { supervisorDecision, supervisorRemarks, relatedMaintenance, relatedTask } = req.body;
    const validDecisions = [
      'Inspection Required',
      'Maintenance Required',
      'No Action Required',
      'Request More Information'
    ];

    if (!validDecisions.includes(supervisorDecision)) {
      return res.status(400).json({ success: false, message: 'Invalid supervisor decision.' });
    }

    const issue = await Issue.findById(req.params.id)
      .populate('equipment', 'equipmentId name')
      .populate('reportedBy', 'name userId email');

    if (!issue || !issue.isActive) {
      return res.status(404).json({ success: false, message: 'Issue not found.' });
    }

    issue.supervisorDecision = supervisorDecision;
    issue.supervisorRemarks = supervisorRemarks || '';
    issue.reviewedBy = req.user._id;
    issue.reviewedAt = new Date();

    if (supervisorDecision === 'Inspection Required') {
      issue.status = 'Inspection Required';
    } else if (supervisorDecision === 'Maintenance Required') {
      issue.status = 'Maintenance Required';
      if (relatedMaintenance) issue.relatedMaintenance = relatedMaintenance;
    } else if (supervisorDecision === 'No Action Required') {
      issue.status = 'No Action Required';
    } else if (supervisorDecision === 'Request More Information') {
      issue.status = 'Clarification Requested';
    }
    if (relatedTask) issue.relatedTask = relatedTask;

    await issue.save();

    // Alert the worker who reported it if clarification requested or resolved
    if (issue.reportedBy) {
      await Alert.create({
        type: 'general',
        title: `Issue Update: ${issue.issueId}`,
        message: `Supervisor ${req.user.name} reviewed your report on ${issue.equipment?.name}: Decision is "${supervisorDecision}". ${supervisorRemarks ? `Remarks: ${supervisorRemarks}` : ''}`,
        priority: 'Medium',
        severity: supervisorDecision === 'Request More Information' ? 'warning' : 'info',
        targetUser: issue.reportedBy._id,
        relatedModule: 'issue',
        relatedId: issue._id,
        createdBy: req.user._id
      });
    }

    await AuditLog.create({
      user: req.user._id,
      userRole: req.user.role,
      action: `Review Issue (${supervisorDecision})`,
      module: 'issue',
      recordId: issue.issueId,
      description: `${req.user.name} reviewed issue ${issue.issueId} on ${issue.equipment?.name} with decision: ${supervisorDecision}`
    });

    res.json({
      success: true,
      message: `Issue review submitted: ${supervisorDecision}`,
      data: issue
    });
  } catch (error) {
    console.error('Review issue error:', error);
    res.status(500).json({ success: false, message: 'Unable to review issue.' });
  }
};

// @desc    Delete issue
// @route   DELETE /api/issues/:id
exports.deleteIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found.' });
    issue.isActive = false;
    await issue.save();
    res.json({ success: true, message: 'Issue removed.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to delete issue.' });
  }
};
