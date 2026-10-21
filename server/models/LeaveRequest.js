const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  leaveId: { type: String, unique: true, required: true },
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  leaveType: { type: String, enum: ['Annual Leave', 'Sick Leave', 'Casual Leave', 'Emergency Leave', 'Unpaid Leave', 'Other'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalDays: { type: Number },
  reason: { type: String, required: [true, 'Reason is required'], trim: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewDate: { type: Date },
  reviewRemarks: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

leaveSchema.pre('validate', async function(next) {
  if (!this.leaveId) {
    const count = await mongoose.model('LeaveRequest').countDocuments();
    this.leaveId = `LV-${String(count + 1001).padStart(4, '0')}`;
  }
  next();
});

leaveSchema.pre('save', function(next) {
  if (this.startDate && this.endDate) {
    const diff = (this.endDate - this.startDate) / (1000 * 60 * 60 * 24);
    this.totalDays = Math.ceil(diff) + 1;
  }
  next();
});

module.exports = mongoose.model('LeaveRequest', leaveSchema);
