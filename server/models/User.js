const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  userId: { type: String, unique: true, required: true },
  username: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
  employeeId: { type: String, trim: true },
  name: { type: String, required: [true, 'Name is required'], trim: true },
  email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
  password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
  role: { type: String, enum: ['admin', 'supervisor', 'worker'], required: true, default: 'worker' },
  phone: { type: String, trim: true },
  department: { type: String, trim: true },
  designation: { type: String, trim: true },
  availability: { type: String, enum: ['Available', 'On Leave', 'Inactive'], default: 'Available' },
  isActive: { type: Boolean, default: true },
  profileImage: { type: String },
  notificationPreferences: {
    email: { type: Boolean, default: true },
    inApp: { type: Boolean, default: true },
    push: { type: Boolean, default: true }
  },
  pushSubscriptions: [{
    endpoint: { type: String, required: true },
    keys: {
      auth: { type: String },
      p256dh: { type: String }
    },
    subscribedAt: { type: Date, default: Date.now }
  }],
  themePreference: { type: String, enum: ['light', 'dark'], default: 'light' },
  lastLogin: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Auto-generate userId and employeeId
userSchema.pre('validate', async function(next) {
  if (!this.userId) {
    const prefix = this.role === 'admin' ? 'ADM' : this.role === 'supervisor' ? 'SUP' : 'WRK';
    const count = await mongoose.model('User').countDocuments({ role: this.role });
    this.userId = `${prefix}-${String(count + 1).padStart(3, '0')}`;
  }
  if (!this.employeeId) {
    this.employeeId = this.userId;
  }
  if (!this.username) {
    this.username = this.userId.toLowerCase().replace(/[^a-z0-9]/g, '');
  }
  next();
});

// Hash password before save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
