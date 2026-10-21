const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// @desc Get system info / settings
router.get('/system', protect, async (req, res) => {
  res.json({
    success: true,
    data: {
      appName: 'MineTrack',
      version: '1.0.0',
      description: 'Mining Equipment & Tyre Maintenance Management Platform',
      environment: process.env.NODE_ENV,
      dbStatus: 'Connected'
    }
  });
});

module.exports = router;
