const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Backwards compatibility alias
  employeeId: { type: String, trim: true },
  userRole: { type: String, enum: ['worker', 'supervisor', 'admin'], default: 'worker' },
  department: { type: String, trim: true },
  date: { type: Date, required: true },
  checkIn: { type: Date },
  checkOut: { type: Date },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late', 'Half Day', 'Leave', 'Holiday'],
    default: 'Present'
  },
  hoursWorked: { type: Number, default: 0 },
  remarks: { type: String, trim: true },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Compound index: one record per user per day
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

// Keep worker and user synced
attendanceSchema.pre('validate', function(next) {
  if (this.user && !this.worker) {
    this.worker = this.user;
  } else if (this.worker && !this.user) {
    this.user = this.worker;
  }
  next();
});

// Calculate hours worked upon check-out
attendanceSchema.pre('save', function(next) {
  if (this.checkIn && this.checkOut) {
    const diff = (this.checkOut - this.checkIn) / (1000 * 60 * 60);
    this.hoursWorked = Math.max(0, Math.round(diff * 100) / 100);
  }
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);
