const Maintenance = require('../models/Maintenance');
const Equipment = require('../models/Equipment');
const Tyre = require('../models/Tyre');
const Alert = require('../models/Alert');
const AuditLog = require('../models/AuditLog');

exports.getMaintenance = async (req, res) => {
  try {
    const { status, maintenanceType, equipment, costStatus, search, page = 1, limit = 50,
            startDate, endDate, assignedWorker } = req.query;
    const query = { isActive: true };
    if (status) query.status = status;
    if (maintenanceType) query.maintenanceType = maintenanceType;
    if (equipment) query.equipment = equipment;
    if (costStatus) query.costStatus = costStatus;
    if (assignedWorker) query.assignedWorker = assignedWorker;
    if (startDate || endDate) {
      query.scheduledDate = {};
      if (startDate) query.scheduledDate.$gte = new Date(startDate);
      if (endDate) query.scheduledDate.$lte = new Date(endDate);
    }
    if (search) {
      query.$or = [
        { maintenanceId: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    // Workers only see their assigned maintenance
    if (req.user.role === 'worker') query.assignedWorker = req.user._id;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [records, total] = await Promise.all([
      Maintenance.find(query).sort({ scheduledDate: -1 }).skip(skip).limit(parseInt(limit))
        .populate('equipment', 'equipmentId name type status location')
        .populate('tyre', 'tyreId brand size position condition')
        .populate('assignedWorker', 'name userId username')
        .populate('supervisor', 'name userId username')
        .populate('costReviewedBy', 'name userId username')
        .populate('bill', 'billId verificationStatus difference enteredCost extractedAmount'),
      Maintenance.countDocuments(query)
    ]);
    res.json({ success: true, count: records.length, total, pages: Math.ceil(total / parseInt(limit)), data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to load maintenance records.' });
  }
};

exports.getMaintenance_single = async (req, res) => {
  try {
    const record = await Maintenance.findById(req.params.id)
      .populate('equipment', 'equipmentId name type status site location department')
      .populate('tyre', 'tyreId brand size position condition mileage')
      .populate('assignedWorker', 'name userId username email phone')
      .populate('supervisor', 'name userId username email')
      .populate('costReviewedBy', 'name userId username')
      .populate({ path: 'bill', populate: { path: 'reviewedBy uploadedBy', select: 'name userId username' } });
    if (!record || !record.isActive) return res.status(404).json({ success: false, message: 'Maintenance record not found.' });
    // Worker can only view their own
    if (req.user.role === 'worker' && record.assignedWorker?._id?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You do not have permission to view this record.' });
    }
    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to load maintenance details.' });
  }
};

exports.createMaintenance = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      title: req.body.title || req.body.description || `${req.body.maintenanceType || 'Routine'} Maintenance Job`,
      enteredCost: req.body.enteredCost !== undefined ? req.body.enteredCost : (req.body.totalCost !== undefined ? req.body.totalCost : null),
      supervisor: req.user.role === 'supervisor' ? req.user._id : req.body.supervisor,
      createdBy: req.user._id
    };
    const record = await Maintenance.create(payload);

    // Update equipment status if needed
    if (record.equipment) {
      await Equipment.findByIdAndUpdate(record.equipment, { status: 'Under Maintenance', lastMaintenanceDate: new Date() });
    }

    // Generate maintenance due alert if due soon
    const maintenanceDate = new Date(record.scheduledDate);
    const daysUntil = Math.ceil((maintenanceDate - new Date()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 3 && daysUntil >= 0) {
      await Alert.create({
        type: 'maintenance_due',
        title: `Maintenance Due Soon: ${record.maintenanceId}`,
        message: `Maintenance ${record.maintenanceId} is scheduled in ${daysUntil} day(s).`,
        priority: 'High',
        severity: 'warning',
        targetRole: 'supervisor',
        relatedModule: 'maintenance',
        relatedId: record._id
      });
    }

    // Check if entered cost vs bill cost creates immediate mismatch alert
    if (record.costStatus === 'Cost Mismatch') {
      await Alert.create({
        type: 'cost_mismatch',
        title: `Cost Mismatch: ${record.maintenanceId}`,
        message: `Cost mismatch on maintenance ${record.maintenanceId}: Entered ₹${record.enteredCost.toLocaleString('en-IN')} vs Bill ₹${record.billCost.toLocaleString('en-IN')} (Variance: ₹${record.variance.toLocaleString('en-IN')}, ${record.variancePercentage}%).`,
        priority: 'High',
        severity: 'critical',
        targetRole: 'supervisor',
        relatedModule: 'maintenance',
        relatedId: record._id
      });
    }

    await AuditLog.create({
      user: req.user._id,
      userRole: req.user.role,
      action: 'Create Maintenance',
      module: 'maintenance',
      recordId: record.maintenanceId,
      description: `${req.user.name} created maintenance ${record.maintenanceId}`
    });

    const populated = await Maintenance.findById(record._id)
      .populate('equipment', 'equipmentId name type status location')
      .populate('tyre', 'tyreId brand size position')
      .populate('assignedWorker', 'name userId username');

    res.status(201).json({ success: true, message: 'Maintenance record created.', data: populated });
  } catch (error) {
    console.error('Create maintenance error:', error);
    res.status(500).json({ success: false, message: 'Unable to create maintenance record.' });
  }
};

exports.updateMaintenance = async (req, res) => {
  try {
    const record = await Maintenance.findById(req.params.id);
    if (!record || !record.isActive) return res.status(404).json({ success: false, message: 'Maintenance record not found.' });

    // Worker can only update assigned records
    if (req.user.role === 'worker' && record.assignedWorker?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only update your assigned maintenance.' });
    }

    const prevStatus = record.status;
    const prevCostStatus = record.costStatus;

    Object.assign(record, req.body);

    if (req.body.status === 'Completed') {
      record.completedDate = new Date();
      if (record.equipment) {
        await Equipment.findByIdAndUpdate(record.equipment, { status: 'Operational' });
      }
    }

    await record.save();

    // If costStatus became Cost Mismatch, trigger alert
    if (record.costStatus === 'Cost Mismatch' && prevCostStatus !== 'Cost Mismatch') {
      await Alert.create({
        type: 'cost_mismatch',
        title: `Cost Mismatch: ${record.maintenanceId}`,
        message: `Maintenance ${record.maintenanceId} has cost mismatch: Entered ₹${(record.enteredCost || 0).toLocaleString('en-IN')} vs Bill ₹${(record.billCost || 0).toLocaleString('en-IN')} (Variance: ₹${(record.variance || 0).toLocaleString('en-IN')}, ${record.variancePercentage}%). Supervisor review required.`,
        priority: 'High',
        severity: 'critical',
        targetRole: 'supervisor',
        relatedModule: 'maintenance',
        relatedId: record._id
      });
    }

    await AuditLog.create({
      user: req.user._id,
      userRole: req.user.role,
      action: 'Update Maintenance',
      module: 'maintenance',
      recordId: record.maintenanceId,
      description: `${req.user.name} updated maintenance ${record.maintenanceId}`,
      previousValue: { status: prevStatus },
      newValue: { status: record.status }
    });

    const populated = await Maintenance.findById(record._id)
      .populate('equipment', 'equipmentId name type status location')
      .populate('tyre', 'tyreId brand size position')
      .populate('assignedWorker', 'name userId username');

    res.json({ success: true, message: 'Maintenance updated.', data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to update maintenance record.' });
  }
};

// @desc    Update Entered Cost and/or Bill Cost with automatic comparison
// @route   PUT /api/maintenance/:id/cost
exports.updateCost = async (req, res) => {
  try {
    const { enteredCost, billCost, remarks } = req.body;
    const record = await Maintenance.findById(req.params.id);
    if (!record || !record.isActive) return res.status(404).json({ success: false, message: 'Maintenance record not found.' });

    if (enteredCost !== undefined) record.enteredCost = enteredCost !== null && enteredCost !== '' ? parseFloat(enteredCost) : null;
    if (billCost !== undefined) record.billCost = billCost !== null && billCost !== '' ? parseFloat(billCost) : null;
    if (remarks) record.remarks = remarks;

    // Reset verification status to pending if cost changed and mismatch occurs
    record.costVerificationStatus = 'Pending';
    await record.save();

    // Trigger alert if mismatch
    if (record.costStatus === 'Cost Mismatch') {
      await Alert.create({
        type: 'cost_mismatch',
        title: `Cost Mismatch: ${record.maintenanceId}`,
        message: `Entered: ₹${(record.enteredCost || 0).toLocaleString('en-IN')} vs Bill: ₹${(record.billCost || 0).toLocaleString('en-IN')} (Variance: ₹${(record.variance || 0).toLocaleString('en-IN')}, ${record.variancePercentage}%). Review required.`,
        priority: 'High',
        severity: 'critical',
        targetRole: 'supervisor',
        relatedModule: 'maintenance',
        relatedId: record._id
      });
    }

    await AuditLog.create({
      user: req.user._id,
      userRole: req.user.role,
      action: 'Update Maintenance Cost',
      module: 'maintenance',
      recordId: record.maintenanceId,
      description: `${req.user.name} updated costs for ${record.maintenanceId}: Entered ₹${record.enteredCost || 0}, Bill ₹${record.billCost || 0}. Status: ${record.costStatus}`
    });

    const populated = await Maintenance.findById(record._id)
      .populate('equipment', 'equipmentId name type status location')
      .populate('tyre', 'tyreId brand size position')
      .populate('assignedWorker', 'name userId username');

    res.json({
      success: true,
      message: `Cost updated. Status: ${record.costStatus}`,
      data: populated
    });
  } catch (error) {
    console.error('Update cost error:', error);
    res.status(500).json({ success: false, message: 'Unable to update costs.' });
  }
};

// @desc    Supervisor reviews Cost Mismatch (Approve, Reject, Request Clarification)
// @route   PUT /api/maintenance/:id/review-cost
exports.reviewCostMismatch = async (req, res) => {
  try {
    if (!['admin', 'supervisor'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only supervisors and admins can review cost mismatches.' });
    }

    const status = req.body.status || req.body.decision;
    const { remarks } = req.body;
    const validStatuses = ['Approved', 'Rejected', 'Clarification Requested'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid review action. Must be Approved, Rejected, or Clarification Requested.' });
    }

    const record = await Maintenance.findById(req.params.id)
      .populate('assignedWorker', 'name userId email');
    if (!record || !record.isActive) return res.status(404).json({ success: false, message: 'Maintenance record not found.' });

    record.costVerificationStatus = status;
    record.costReviewedBy = req.user._id;
    record.costReviewDate = new Date();
    if (remarks) record.costReviewRemarks = remarks;

    await record.save();

    // Notify assigned worker if needed
    if (record.assignedWorker && status !== 'Approved') {
      await Alert.create({
        type: 'general',
        title: `Cost Mismatch Review: ${record.maintenanceId}`,
        message: `Supervisor ${req.user.name} reviewed cost mismatch on ${record.maintenanceId}: ${status}. ${remarks ? `Remarks: ${remarks}` : ''}`,
        priority: 'High',
        severity: 'warning',
        targetUser: record.assignedWorker._id,
        relatedModule: 'maintenance',
        relatedId: record._id
      });
    }

    await AuditLog.create({
      user: req.user._id,
      userRole: req.user.role,
      action: `Review Cost Mismatch (${status})`,
      module: 'maintenance',
      recordId: record.maintenanceId,
      description: `${req.user.name} reviewed cost mismatch on ${record.maintenanceId}: ${status}`
    });

    const populated = await Maintenance.findById(record._id)
      .populate('equipment', 'equipmentId name type status location')
      .populate('tyre', 'tyreId brand size position')
      .populate('assignedWorker', 'name userId username')
      .populate('costReviewedBy', 'name userId username');

    res.json({
      success: true,
      message: `Cost mismatch review saved: ${status}`,
      data: populated
    });
  } catch (error) {
    console.error('Review cost error:', error);
    res.status(500).json({ success: false, message: 'Unable to process cost mismatch review.' });
  }
};

exports.deleteMaintenance = async (req, res) => {
  try {
    const record = await Maintenance.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Maintenance record not found.' });
    record.isActive = false;
    await record.save();
    res.json({ success: true, message: 'Maintenance record deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to delete maintenance record.' });
  }
};

// Check overdue maintenance periodically
exports.checkOverdue = async (req, res) => {
  try {
    const result = await Maintenance.updateMany(
      { status: { $in: ['Scheduled', 'Pending'] }, scheduledDate: { $lt: new Date() }, isActive: true },
      { $set: { status: 'Overdue' } }
    );
    res.json({ success: true, message: `Checked overdue. Updated: ${result.modifiedCount}` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Overdue check failed.' });
  }
};
