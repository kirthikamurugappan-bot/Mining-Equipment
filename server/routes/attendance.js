const express = require('express');
const router = express.Router();
const { getAttendance, checkIn, checkOut, getTodayStatus, getAnalytics } = require('../controllers/attendanceController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getAttendance);
router.get('/today', getTodayStatus);
router.get('/analytics', getAnalytics);
router.post('/checkin', checkIn);
router.post('/checkout', checkOut);

module.exports = router;
