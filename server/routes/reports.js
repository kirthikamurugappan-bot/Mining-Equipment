const express = require('express');
const router = express.Router();
const { getDashboardStats, getMonthlyReport, getAnalytics } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/dashboard', getDashboardStats);
router.get('/monthly', getMonthlyReport);
router.get('/analytics', getAnalytics);

module.exports = router;
