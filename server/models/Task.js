const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  taskId: { type: String, unique: true, required: true },
  title: { type: String, required: [true, 'Task title is required'], trim: true },
  description: { type: String, trim: true },
  equipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', default: null },
  maintenance: { type: mongoose.Schema.Types.ObjectId, ref: 'Maintenance', default: null },
  assignedWorker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  status: {
    type: String,
    enum: [
      'Not Seen',
      'Assigned',
      'Acknowledged',
      'In Progress',
      'Completed',
      'Pending',
      'Overdue',
      'Pending Review',
      'Rejected'
    ],
    default: 'Assigned'
  },
  assignedDate: { type: Date, default: Date.now },
  acknowledgedDate: { type: Date },
  startDate: { type: Date },
  dueDate: { type: Date, required: [true, 'Due date is required'] },
  completedDate: { type: Date },
  instructions: { type: String, trim: true },
  workerRemarks: { type: String, trim: true },
  supervisorRemarks: { type: String, trim: true },
  remarks: { type: String, trim: true },
  evidence: [{ type: String }],
  progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

taskSchema.pre('validate', async function(next) {
  if (!this.taskId) {
    const count = await mongoose.model('Task').countDocuments();
    this.taskId = `TSK-${String(count + 1001).padStart(4, '0')}`;
  }
  next();
});

taskSchema.pre('save', function(next) {
  // Only auto-mark as Overdue if status is not explicitly modified in this save or if transitioning to Overdue
  if (!this.isModified('status') && ['Not Seen', 'Assigned', 'Pending'].includes(this.status) && this.dueDate && this.dueDate < new Date()) {
    this.status = 'Overdue';
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);
