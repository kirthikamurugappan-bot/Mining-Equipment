const express = require('express');
const router = express.Router();
const { login, logout, getMe, updatePassword, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/password', protect, updatePassword);
router.put('/profile', protect, updateProfile);

module.exports = router;
