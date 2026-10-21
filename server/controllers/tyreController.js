const Tyre = require('../models/Tyre');
const Alert = require('../models/Alert');
const AuditLog = require('../models/AuditLog');
const Equipment = require('../models/Equipment');

exports.getTyres = async (req, res) => {
  try {
    const { condition, equipment, search, page = 1, limit = 20 } = req.query;
    const query = { isActive: true };
    if (condition) query.condition = condition;
    if (equipment) query.equipment = equipment;
    if (search) {
      query.$or = [
        { tyreId: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { size: { $regex: search, $options: 'i' } }
      ];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [tyres, total] = await Promise.all([
      Tyre.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit))
        .populate('equipment', 'equipmentId name type status').populate('createdBy', 'name userId'),
      Tyre.countDocuments(query)
    ]);
    res.json({ success: true, count: tyres.length, total, pages: Math.ceil(total / parseInt(limit)), data: tyres });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to load tyre records.' });
  }
};

exports.getTyre = async (req, res) => {
  try {
    const tyre = await Tyre.findById(req.params.id)
      .populate('equipment', 'equipmentId name type status assignedWorker')
      .populate('inspectionHistory.inspectedBy', 'name userId');
    if (!tyre || !tyre.isActive) return res.status(404).json({ success: false, message: 'Tyre not found.' });
    res.json({ success: true, data: tyre });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to load tyre details.' });
  }
};

exports.createTyre = async (req, res) => {
  try {
    const tyre = await Tyre.create({ ...req.body, createdBy: req.user._id });
    await AuditLog.create({
      user: req.user._id, userRole: req.user.role, action: 'Create Tyre',
      module: 'tyre', recordId: tyre.tyreId,
      description: `${req.user.name} added tyre ${tyre.tyreId} (${tyre.brand} ${tyre.size})`
    });
    res.status(201).json({ success: true, message: 'Tyre added successfully.', data: tyre });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to add tyre.' });
  }
};

exports.updateTyre = async (req, res) => {
  try {
    const tyre = await Tyre.findById(req.params.id);
    if (!tyre || !tyre.isActive) return res.status(404).json({ success: false, message: 'Tyre not found.' });
    const prevCondition = tyre.condition;
    Object.assign(tyre, req.body);
    await tyre.save();

    // Generate critical alert if condition changed to Critical
    if (prevCondition !== 'Critical' && tyre.condition === 'Critical') {
      const eq = tyre.equipment ? await Equipment.findById(tyre.equipment) : null;
      await Alert.create({
        type: 'tyre_critical',
        title: `Critical Tyre Condition: ${tyre.tyreId}`,
        message: `Tyre ${tyre.tyreId} (${tyre.brand} ${tyre.size}) on ${eq ? eq.name : 'unassigned equipment'} is in CRITICAL condition. Immediate replacement required.`,
        severity: 'critical', targetRole: 'supervisor',
        relatedModule: 'tyre', relatedId: tyre._id
      });
    }
    await AuditLog.create({
      user: req.user._id, userRole: req.user.role, action: 'Update Tyre',
      module: 'tyre', recordId: tyre.tyreId,
      description: `${req.user.name} updated tyre ${tyre.tyreId}`,
      previousValue: { condition: prevCondition }, newValue: { condition: tyre.condition }
    });
    res.json({ success: true, message: 'Tyre updated successfully.', data: tyre });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to update tyre.' });
  }
};

exports.inspectTyre = async (req, res) => {
  try {
    const { condition, mileage, notes } = req.body;
    const tyre = await Tyre.findById(req.params.id);
    if (!tyre || !tyre.isActive) return res.status(404).json({ success: false, message: 'Tyre not found.' });
    const prevCondition = tyre.condition;
    tyre.condition = condition || tyre.condition;
    tyre.mileage = mileage || tyre.mileage;
    tyre.lastInspectionDate = new Date();
    tyre.nextInspectionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    tyre.inspectionHistory.push({ date: new Date(), condition: tyre.condition, mileage: tyre.mileage, inspectedBy: req.user._id, notes });
    await tyre.save();

    if (prevCondition !== 'Critical' && tyre.condition === 'Critical') {
      const eq = tyre.equipment ? await Equipment.findById(tyre.equipment) : null;
      await Alert.create({
        type: 'tyre_critical', title: `Critical Tyre: ${tyre.tyreId}`,
        message: `Tyre ${tyre.tyreId} on ${eq ? eq.name : 'unassigned'} flagged CRITICAL during inspection.`,
        severity: 'critical', targetRole: 'supervisor', relatedModule: 'tyre', relatedId: tyre._id
      });
    }
    res.json({ success: true, message: 'Tyre inspection recorded.', data: tyre });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Inspection record failed.' });
  }
};

exports.deleteTyre = async (req, res) => {
  try {
    const tyre = await Tyre.findById(req.params.id);
    if (!tyre) return res.status(404).json({ success: false, message: 'Tyre not found.' });
    tyre.isActive = false;
    await tyre.save();
    res.json({ success: true, message: 'Tyre record deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to delete tyre.' });
  }
};
