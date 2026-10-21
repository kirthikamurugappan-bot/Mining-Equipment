const express = require('express');
const router = express.Router();
const { getLeaves, applyLeave, reviewLeave } = require('../controllers/leaveController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', getLeaves);
router.post('/', authorize('worker'), applyLeave);
router.put('/:id/review', authorize('admin', 'supervisor'), reviewLeave);

module.exports = router;
