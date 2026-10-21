const mongoose = require('mongoose');

const tyreSchema = new mongoose.Schema({
  tyreId: { type: String, unique: true, required: true },
  brand: { type: String, required: [true, 'Brand is required'], trim: true },
  size: { type: String, required: [true, 'Size is required'], trim: true },
  type: { type: String, trim: true, enum: ['Radial', 'Bias', 'Solid', 'Other'], default: 'Radial' },
  equipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', default: null },
  position: {
    type: String,
    trim: true,
    enum: [
      'Front-Left',
      'Front-Right',
      'Rear-Left',
      'Rear-Right',
      'Rear-Left-Outer',
      'Rear-Left-Inner',
      'Rear-Right-Outer',
      'Rear-Right-Inner',
      'Spare',
      'Not Assigned'
    ],
    default: 'Not Assigned'
  },
  installationDate: { type: Date },
  condition: {
    type: String,
    enum: ['Good', 'Warning', 'Worn', 'Critical', 'Replacement Required', 'Replaced'],
    default: 'Good'
  },
  status: {
    type: String,
    enum: ['In Service', 'Under Inspection', 'Replacement Required', 'Replaced', 'Scrapped', 'Spare'],
    default: 'In Service'
  },
  mileage: { type: Number, default: 0 },
  lastInspectionDate: { type: Date },
  nextInspectionDate: { type: Date },
  replacementDate: { type: Date },
  notes: { type: String, trim: true },
  inspectionHistory: [{
    date: { type: Date, default: Date.now },
    condition: { type: String },
    mileage: { type: Number },
    inspectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String }
  }],
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

tyreSchema.pre('validate', async function(next) {
  if (!this.tyreId) {
    const count = await mongoose.model('Tyre').countDocuments();
    this.tyreId = `TY-${String(count + 1001).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Tyre', tyreSchema);
