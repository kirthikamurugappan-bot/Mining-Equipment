const path = require('path');
const Tesseract = require('tesseract.js');
const Bill = require('../models/Bill');
const Maintenance = require('../models/Maintenance');
const Alert = require('../models/Alert');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const { sendNotification } = require('../utils/notify');

// Extract amount from OCR text using multiple patterns
function extractAmountFromText(text) {
  if (!text) return null;
  const cleaned = text.replace(/,/g, '');
  // Patterns: Total: 12500, Amount: Rs.12500, Grand Total ₹12500, etc.
  const patterns = [
    /(?:grand\s+total|total\s+amount|net\s+amount|amount\s+due|total\s+payable|invoice\s+total|total)[:\s₹Rs\.]*([0-9]+(?:\.[0-9]{1,2})?)/gi,
    /(?:amount)[:\s₹Rs\.]*([0-9]+(?:\.[0-9]{1,2})?)/gi,
    /₹\s*([0-9]+(?:\.[0-9]{1,2})?)/gi,
    /Rs\.?\s*([0-9]+(?:\.[0-9]{1,2})?)/gi,
    /INR\s*([0-9]+(?:\.[0-9]{1,2})?)/gi
  ];
  const amounts = [];
  for (const pattern of patterns) {
    let match;
    pattern.lastIndex = 0;
    while ((match = pattern.exec(cleaned)) !== null) {
      const val = parseFloat(match[1]);
      if (val > 0 && val < 100000000) amounts.push(val);
    }
    if (amounts.length > 0) break;
  }
  if (amounts.length === 0) return null;
  // Return the largest amount found (likely the total)
  return Math.max(...amounts);
}

// Extract bill metadata from OCR text
function extractBillMetadata(text) {
  const metadata = {};
  // Bill number
  const billMatch = text.match(/(?:bill|invoice|receipt)\s*(?:no|number|#)[:\s]*([A-Z0-9\-\/]+)/i);
  if (billMatch) metadata.billNumber = billMatch[1].trim();
  // Date
  const dateMatch = text.match(/(?:date)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{1,2}\s+\w+\s+\d{4})/i);
  if (dateMatch) metadata.billDate = dateMatch[1];
  // Vendor
  const vendorMatch = text.match(/(?:from|vendor|supplier|sold\s+by|party)[:\s]*([A-Za-z\s&.,]+?)(?:\n|$)/i);
  if (vendorMatch) metadata.vendor = vendorMatch[1].trim().substring(0, 100);
  return metadata;
}

// @desc    Upload bill and run OCR
// @route   POST /api/bills/upload/:maintenanceId
exports.uploadBill = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a bill file (JPG, PNG, or PDF).' });
    }
    const { maintenanceId } = req.params;
    const maintenance = await Maintenance.findById(maintenanceId);
    if (!maintenance) return res.status(404).json({ success: false, message: 'Maintenance record not found.' });

    const enteredCost = parseFloat(req.body.enteredCost) || maintenance.enteredCost || maintenance.totalCost;
    if (!enteredCost || enteredCost <= 0) {
      return res.status(400).json({ success: false, message: 'Please enter a valid maintenance cost before uploading a bill.' });
    }

    const filePath = req.file.path;
    const fileName = req.file.filename;
    const fileType = req.file.mimetype;

    let extractedAmount = null;
    let ocrRawText = '';
    let ocrConfidence = 0;
    let verificationStatus = 'Manual Review Required';
    let billMetadata = {};

    // Run OCR on image files
    const isImage = ['image/jpeg', 'image/png', 'image/webp'].includes(fileType);
    if (isImage) {
      try {
        const result = await Tesseract.recognize(filePath, 'eng', {
          logger: () => {} // suppress progress logs
        });
        ocrRawText = result.data.text;
        ocrConfidence = result.data.confidence;
        billMetadata = extractBillMetadata(ocrRawText);
        if (ocrConfidence >= 30) {
          extractedAmount = extractAmountFromText(ocrRawText);
        }
      } catch (ocrError) {
        console.error('OCR Error:', ocrError.message);
        ocrConfidence = 0;
      }
    }

    let difference = null;
    if (extractedAmount !== null) {
      difference = Math.abs(enteredCost - extractedAmount);
      const tolerance = enteredCost * 0.01; // 1% tolerance
      if (difference <= tolerance) {
        verificationStatus = 'Cost Verified';
      } else {
        verificationStatus = 'Cost Mismatch';
      }
    }

    // Delete existing bill if any
    if (maintenance.bill) {
      await Bill.findByIdAndDelete(maintenance.bill);
    }

    const bill = await Bill.create({
      maintenance: maintenance._id,
      enteredCost,
      extractedAmount,
      difference,
      verificationStatus,
      ocrConfidence,
      ocrRawText: ocrRawText.substring(0, 2000),
      filePath: `/uploads/bills/${fileName}`,
      fileName,
      fileType,
      uploadedBy: req.user._id,
      ...billMetadata
    });

    maintenance.bill = bill._id;
    maintenance.enteredCost = enteredCost;
    await maintenance.save();

    // Generate mismatch alert & notifications
    if (verificationStatus === 'Cost Mismatch') {
      await Alert.create({
        type: 'cost_mismatch',
        title: `Cost Mismatch: ${maintenance.maintenanceId}`,
        message: `Bill for maintenance ${maintenance.maintenanceId} shows a cost mismatch. Entered: ₹${enteredCost.toLocaleString('en-IN')} | Extracted: ₹${extractedAmount.toLocaleString('en-IN')} | Difference: ₹${difference.toLocaleString('en-IN')}. Supervisor review required.`,
        severity: 'critical', targetRole: 'supervisor',
        relatedModule: 'bill', relatedId: bill._id
      });

      try {
        const supervisors = await User.find({ role: { $in: ['supervisor', 'admin'] }, isActive: true });
        for (const sup of supervisors) {
          await sendNotification({
            recipient: sup._id,
            type: 'cost_mismatch',
            title: `Cost Mismatch Alert: ${maintenance.maintenanceId}`,
            message: `Invoice amount ₹${extractedAmount.toLocaleString('en-IN')} differs from estimate ₹${enteredCost.toLocaleString('en-IN')} by ₹${difference.toLocaleString('en-IN')}. Review required.`,
            priority: 'High',
            relatedRecordId: maintenance._id,
            relatedRecordType: 'maintenance',
            actionUrl: `/maintenance?id=${maintenance._id}`
          });
        }
      } catch (e) {
        // Non-fatal
      }
    } else if (verificationStatus === 'Manual Review Required') {
      await Alert.create({
        type: 'bill_pending',
        title: `Bill Needs Manual Review: ${maintenance.maintenanceId}`,
        message: `Bill amount for maintenance ${maintenance.maintenanceId} could not be extracted automatically. Manual verification required.`,
        severity: 'warning', targetRole: 'supervisor',
        relatedModule: 'bill', relatedId: bill._id
      });
    }

    await AuditLog.create({
      user: req.user._id, userRole: req.user.role, action: 'Upload Bill',
      module: 'bill', recordId: bill.billId,
      description: `${req.user.name} uploaded bill for maintenance ${maintenance.maintenanceId}. Status: ${verificationStatus}`
    });

    res.status(201).json({
      success: true,
      message: `Bill uploaded. Verification status: ${verificationStatus}`,
      data: bill
    });
  } catch (error) {
    console.error('Bill upload error:', error);
    res.status(500).json({ success: false, message: 'Bill upload failed. Please try again.' });
  }
};

// @desc    Get bill by maintenance
// @route   GET /api/bills/maintenance/:maintenanceId
exports.getBillByMaintenance = async (req, res) => {
  try {
    const maintenance = await Maintenance.findById(req.params.maintenanceId);
    if (!maintenance) return res.status(404).json({ success: false, message: 'Maintenance not found.' });
    const bill = await Bill.findById(maintenance.bill)
      .populate('uploadedBy', 'name userId')
      .populate('reviewedBy', 'name userId');
    if (!bill) return res.status(404).json({ success: false, message: 'No bill found for this maintenance.' });
    res.json({ success: true, data: bill });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to load bill.' });
  }
};

// @desc    Supervisor reviews bill
// @route   PUT /api/bills/:id/review
exports.reviewBill = async (req, res) => {
  try {
    if (!['admin', 'supervisor'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only supervisors and admins can review bills.' });
    }
    const { verificationStatus, reviewRemarks } = req.body;
    const validStatuses = ['Approved', 'Rejected', 'Clarification Requested'];
    if (!validStatuses.includes(verificationStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid review status.' });
    }
    const bill = await Bill.findById(req.params.id).populate({ path: 'maintenance', select: 'maintenanceId assignedWorker' });
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found.' });
    bill.verificationStatus = verificationStatus;
    bill.reviewedBy = req.user._id;
    bill.reviewDate = new Date();
    bill.reviewRemarks = reviewRemarks;
    await bill.save();
    // Notify worker
    if (bill.maintenance?.assignedWorker) {
      await Alert.create({
        type: 'general', title: `Bill Review: ${bill.billId}`,
        message: `Your bill (${bill.billId}) has been ${verificationStatus.toLowerCase()} by ${req.user.name}. ${reviewRemarks || ''}`,
        severity: verificationStatus === 'Approved' ? 'success' : 'warning',
        targetUser: bill.maintenance.assignedWorker, relatedModule: 'bill', relatedId: bill._id
      });
    }
    await AuditLog.create({
      user: req.user._id, userRole: req.user.role, action: `Bill ${verificationStatus}`,
      module: 'bill', recordId: bill.billId,
      description: `${req.user.name} ${verificationStatus.toLowerCase()} bill ${bill.billId}`
    });
    res.json({ success: true, message: `Bill ${verificationStatus.toLowerCase()}.`, data: bill });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Bill review failed.' });
  }
};

// @desc    Get all bills (with filters)
// @route   GET /api/bills
exports.getBills = async (req, res) => {
  try {
    const { verificationStatus, page = 1, limit = 20 } = req.query;
    const query = {};
    if (verificationStatus) query.verificationStatus = verificationStatus;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [bills, total] = await Promise.all([
      Bill.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit))
        .populate({ path: 'maintenance', select: 'maintenanceId maintenanceType equipment', populate: { path: 'equipment', select: 'equipmentId name' } })
        .populate('uploadedBy', 'name userId')
        .populate('reviewedBy', 'name userId'),
      Bill.countDocuments(query)
    ]);
    res.json({ success: true, count: bills.length, total, pages: Math.ceil(total / parseInt(limit)), data: bills });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to load bills.' });
  }
};
