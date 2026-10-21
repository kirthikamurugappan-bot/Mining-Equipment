const Equipment = require('../models/Equipment');
const Maintenance = require('../models/Maintenance');
const Tyre = require('../models/Tyre');
const AuditLog = require('../models/AuditLog');

exports.getEquipment = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20, assignedWorker } = req.query;
    const query = { isActive: true };
    if (status) query.status = status;
    if (assignedWorker) query.assignedWorker = assignedWorker;
    if (search) {
      query.$or = [
        { equipmentId: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } }
      ];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [equipment, total] = await Promise.all([
      Equipment.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit))
        .populate('assignedWorker', 'name userId').populate('createdBy', 'name userId'),
      Equipment.countDocuments(query)
    ]);
    res.json({ success: true, count: equipment.length, total, pages: Math.ceil(total / parseInt(limit)), data: equipment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to load equipment. Please try again.' });
  }
};

exports.getEquipmentById = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id)
      .populate('assignedWorker', 'name userId email phone');
    if (!equipment || !equipment.isActive) {
      return res.status(404).json({ success: false, message: 'Equipment not found.' });
    }
    const [maintenanceHistory, tyres] = await Promise.all([
      Maintenance.find({ equipment: equipment._id, isActive: true }).sort({ scheduledDate: -1 }).limit(10)
        .populate('assignedWorker', 'name userId').select('maintenanceId maintenanceType status scheduledDate totalCost'),
      Tyre.find({ equipment: equipment._id, isActive: true })
        .select('tyreId brand size position condition lastInspectionDate')
    ]);
    res.json({ success: true, data: { ...equipment.toJSON(), maintenanceHistory, tyres } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to load equipment details.' });
  }
};

exports.createEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.create({ ...req.body, createdBy: req.user._id });
    await AuditLog.create({
      user: req.user._id, userRole: req.user.role, action: 'Create Equipment',
      module: 'equipment', recordId: equipment.equipmentId,
      description: `${req.user.name} added equipment ${equipment.name} (${equipment.equipmentId})`
    });
    res.status(201).json({ success: true, message: 'Equipment created successfully.', data: equipment });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: 'Equipment ID already exists.' });
    res.status(500).json({ success: false, message: 'Unable to create equipment. Please try again.' });
  }
};

exports.updateEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment || !equipment.isActive) {
      return res.status(404).json({ success: false, message: 'Equipment not found.' });
    }
    const prev = { status: equipment.status, assignedWorker: equipment.assignedWorker };
    Object.assign(equipment, req.body);
    await equipment.save();
    await AuditLog.create({
      user: req.user._id, userRole: req.user.role, action: 'Update Equipment',
      module: 'equipment', recordId: equipment.equipmentId,
      description: `${req.user.name} updated equipment ${equipment.name} (${equipment.equipmentId})`,
      previousValue: prev, newValue: { status: equipment.status, assignedWorker: equipment.assignedWorker }
    });
    res.json({ success: true, message: 'Equipment updated successfully.', data: equipment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to update equipment.' });
  }
};

exports.deleteEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) return res.status(404).json({ success: false, message: 'Equipment not found.' });
    equipment.isActive = false;
    equipment.status = 'Inactive';
    await equipment.save();
    await AuditLog.create({
      user: req.user._id, userRole: req.user.role, action: 'Deactivate Equipment',
      module: 'equipment', recordId: equipment.equipmentId,
      description: `${req.user.name} deactivated equipment ${equipment.name} (${equipment.equipmentId})`
    });
    res.json({ success: true, message: 'Equipment deactivated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to deactivate equipment.' });
  }
};
