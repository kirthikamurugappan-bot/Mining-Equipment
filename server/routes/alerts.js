const express = require('express');
const router = express.Router();
const { getAlerts, markRead, markAllRead, updateAlertStatus, getUnreadCount } = require('../controllers/alertController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getAlerts);
router.get('/unread-count', getUnreadCount);
router.put('/:id/read', markRead);
router.put('/:id/status', updateAlertStatus);
router.put('/mark-all-read', markAllRead);

module.exports = router;
