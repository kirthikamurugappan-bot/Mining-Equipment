const express = require('express');
const router = express.Router();
const { uploadBill, getBillByMaintenance, reviewBill, getBills } = require('../controllers/billController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);
router.get('/', authorize('admin', 'supervisor'), getBills);
router.get('/maintenance/:maintenanceId', getBillByMaintenance);
router.post('/upload/:maintenanceId', upload.single('bill'), uploadBill);
router.put('/:id/review', authorize('admin', 'supervisor'), reviewBill);

module.exports = router;
