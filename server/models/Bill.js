const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  billId: { type: String, unique: true, required: true },
  maintenance: { type: mongoose.Schema.Types.ObjectId, ref: 'Maintenance', required: true },
  billNumber: { type: String, trim: true },
  vendor: { type: String, trim: true },
  billDate: { type: Date },
  enteredCost: { type: Number, required: true },
  extractedAmount: { type: Number, default: null },
  difference: { type: Number, default: null },
  verificationStatus: { type: String,
    enum: ['Pending', 'Cost Verified', 'Cost Mismatch', 'Manual Review Required', 'Approved', 'Rejected', 'Clarification Requested'],
    default: 'Pending' },
  ocrConfidence: { type: Number, default: null },
  ocrRawText: { type: String, default: null },
  filePath: { type: String },
  fileName: { type: String },
  fileType: { type: String },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewDate: { type: Date },
  reviewRemarks: { type: String, trim: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

billSchema.pre('validate', async function(next) {
  if (!this.billId) {
    const count = await mongoose.model('Bill').countDocuments();
    this.billId = `BILL-${String(count + 1001).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Bill', billSchema);
