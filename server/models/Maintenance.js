const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  maintenanceId: { type: String, unique: true, required: true },
  equipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: [true, 'Equipment is required'] },
  tyre: { type: mongoose.Schema.Types.ObjectId, ref: 'Tyre', default: null },
  maintenanceType: {
    type: String,
    required: true,
    enum: [
      'Preventive',
      'Corrective',
      'Emergency',
      'Inspection',
      'Oil Change',
      'Brake Service',
      'Tyre Maintenance',
      'Preventive Maintenance',
      'Corrective Maintenance',
      'Emergency Maintenance'
    ],
    default: 'Preventive'
  },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  title: { type: String, required: [true, 'Title is required'], trim: true },
  description: { type: String, trim: true },
  scheduledDate: { type: Date, required: [true, 'Scheduled date is required'] },
  startDate: { type: Date },
  completedDate: { type: Date },
  assignedWorker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  supervisor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: {
    type: String,
    enum: ['Scheduled', 'In Progress', 'Completed', 'Pending', 'Overdue'],
    default: 'Scheduled'
  },
  partsUsed: [{
    partName: String,
    quantity: Number,
    unitCost: Number
  }],
  labourCost: { type: Number, default: 0 },
  partsCost: { type: Number, default: 0 },
  otherCost: { type: Number, default: 0 },
  totalCost: { type: Number, default: 0 },
  enteredCost: { type: Number, default: null },
  billCost: { type: Number, default: null },
  variance: { type: Number, default: 0 },
  variancePercentage: { type: Number, default: 0 },
  costStatus: {
    type: String,
    enum: ['Cost Matched', 'Cost Mismatch', 'Bill Cost Missing', 'Entered Cost Missing', 'Awaiting Cost Data'],
    default: 'Awaiting Cost Data'
  },
  costVerificationStatus: {
    type: String,
    enum: ['Pending', 'Cost Matched', 'Approved', 'Rejected', 'Clarification Requested'],
    default: 'Pending'
  },
  costReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  costReviewDate: { type: Date, default: null },
  costReviewRemarks: { type: String, trim: true },
  bill: { type: mongoose.Schema.Types.ObjectId, ref: 'Bill', default: null },
  remarks: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

maintenanceSchema.pre('validate', async function(next) {
  if (!this.maintenanceId) {
    const count = await mongoose.model('Maintenance').countDocuments();
    this.maintenanceId = `MA-${String(count + 1001).padStart(4, '0')}`;
  }
  next();
});

// Auto-calculate totalCost, variance, and cost comparison status
maintenanceSchema.pre('save', function(next) {
  // If breakdown costs exist, update totalCost
  const breakdownSum = (this.labourCost || 0) + (this.partsCost || 0) + (this.otherCost || 0);
  if (breakdownSum > 0 && (!this.enteredCost || this.enteredCost === 0)) {
    this.enteredCost = breakdownSum;
  }
  this.totalCost = this.enteredCost || breakdownSum || 0;

  // Cost comparison calculation
  const hasEntered = this.enteredCost !== null && this.enteredCost !== undefined && !isNaN(this.enteredCost);
  const hasBill = this.billCost !== null && this.billCost !== undefined && !isNaN(this.billCost);

  if (hasEntered && hasBill) {
    this.variance = Number((this.billCost - this.enteredCost).toFixed(2));
    if (this.enteredCost !== 0) {
      this.variancePercentage = Number((((this.billCost - this.enteredCost) / this.enteredCost) * 100).toFixed(2));
    } else {
      this.variancePercentage = 0;
    }

    if (this.variance === 0) {
      this.costStatus = 'Cost Matched';
      if (this.costVerificationStatus === 'Pending') {
        this.costVerificationStatus = 'Cost Matched';
      }
    } else {
      this.costStatus = 'Cost Mismatch';
      if (this.costVerificationStatus === 'Cost Matched') {
        this.costVerificationStatus = 'Pending';
      }
    }
  } else if (hasEntered && !hasBill) {
    this.costStatus = 'Bill Cost Missing';
    this.variance = 0;
    this.variancePercentage = 0;
  } else if (!hasEntered && hasBill) {
    this.costStatus = 'Entered Cost Missing';
    this.variance = 0;
    this.variancePercentage = 0;
  } else {
    this.costStatus = 'Awaiting Cost Data';
    this.variance = 0;
    this.variancePercentage = 0;
  }

  // Check overdue
  if (this.status === 'Scheduled' && this.scheduledDate < new Date()) {
    this.status = 'Overdue';
  }
  next();
});

module.exports = mongoose.model('Maintenance', maintenanceSchema);
