const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  equipmentId: { type: String, unique: true, required: true },
  name: { type: String, required: [true, 'Equipment name is required'], trim: true },
  type: {
    type: String,
    required: [true, 'Equipment type is required'],
    trim: true,
    enum: [
      'Dump Truck',
      'Excavator',
      'Wheel Loader',
      'Loader',
      'Bulldozer',
      'Drilling Machine',
      'Drill Rig',
      'Grader',
      'Haul Truck',
      'Water Truck',
      'Crusher',
      'Conveyor',
      'Other'
    ]
  },
  model: { type: String, trim: true },
  manufacturer: { type: String, trim: true },
  year: { type: Number },
  serialNumber: { type: String, trim: true },
  registrationNumber: { type: String, trim: true },
  department: { type: String, trim: true },
  site: { type: String, trim: true },
  location: { type: String, trim: true },
  purchaseDate: { type: Date },
  status: {
    type: String,
    enum: ['Operational', 'Under Maintenance', 'Inactive'],
    default: 'Operational'
  },
  assignedWorker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  notes: { type: String, trim: true },
  description: { type: String, trim: true },
  lastMaintenanceDate: { type: Date },
  nextMaintenanceDate: { type: Date },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

equipmentSchema.pre('validate', async function(next) {
  if (!this.equipmentId) {
    const count = await mongoose.model('Equipment').countDocuments();
    this.equipmentId = `EQ-${String(count + 1).padStart(3, '0')}`;
  }
  if (!this.location && this.site) {
    this.location = this.site;
  }
  if (!this.site && this.location) {
    this.site = this.location;
  }
  if (!this.notes && this.description) {
    this.notes = this.description;
  }
  if (!this.description && this.notes) {
    this.description = this.notes;
  }
  next();
});

module.exports = mongoose.model('Equipment', equipmentSchema);
