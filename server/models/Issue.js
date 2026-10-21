const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  issueId: { type: String, unique: true, required: true },
  equipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: [true, 'Equipment is required'] },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  issueType: {
    type: String,
    required: [true, 'Issue type is required'],
    enum: [
      'Engine Fault',
      'Engine',
      'Tyre Damage',
      'Tyre',
      'Hydraulic Leak',
      'Hydraulic',
      'Brake Failure',
      'Brakes',
      'Electrical Issue',
      'Electrical',
      'Transmission Issue',
      'Transmission',
      'Structural Crack',
      'Structural',
      'Abnormal Noise/Vibration',
      'Other'
    ],
    default: 'Other'
  },
  description: { type: String, required: [true, 'Description is required'], trim: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  photo: { type: String },
  date: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: [
      'Reported',
      'Under Review',
      'Inspection Required',
      'Maintenance Required',
      'No Action Required',
      'Clarification Requested',
      'Resolved'
    ],
    default: 'Reported'
  },
  supervisorDecision: {
    type: String,
    enum: ['Inspection Required', 'Maintenance Required', 'No Action Required', 'Request More Information', null],
    default: null
  },
  supervisorRemarks: { type: String, trim: true },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date },
  relatedMaintenance: { type: mongoose.Schema.Types.ObjectId, ref: 'Maintenance', default: null },
  relatedTask: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

issueSchema.pre('validate', async function(next) {
  if (!this.issueId) {
    const count = await mongoose.model('Issue').countDocuments();
    this.issueId = `ISS-${String(count + 1001).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Issue', issueSchema);
