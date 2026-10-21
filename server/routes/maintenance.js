const express = require('express');
const router = express.Router();
const {
  getMaintenance,
  getMaintenance_single,
  createMaintenance,
  updateMaintenance,
  updateCost,
  reviewCostMismatch,
  deleteMaintenance,
  checkOverdue
} = require('../controllers/maintenanceController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getMaintenance);
router.get('/check-overdue', authorize('admin', 'supervisor'), checkOverdue);
router.get('/:id', getMaintenance_single);
router.post('/', authorize('admin', 'supervisor'), createMaintenance);
router.put('/:id', updateMaintenance);
router.put('/:id/cost', updateCost);
router.put('/:id/review-cost', authorize('admin', 'supervisor'), reviewCostMismatch);
router.delete('/:id', authorize('admin'), deleteMaintenance);

module.exports = router;
