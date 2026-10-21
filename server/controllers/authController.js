const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const rawUsername = (req.body.username || req.body.email || '').trim();
    const rawPassword = req.body.password || '';

    if (!rawUsername) {
      return res.status(400).json({ success: false, message: 'Username is required.' });
    }
    if (!rawPassword) {
      return res.status(400).json({ success: false, message: 'Password is required.' });
    }

    const escaped = rawUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^${escaped}$`, 'i');

    const user = await User.findOne({
      $or: [
        { username: regex },
        { email: regex },
        { userId: regex },
        { employeeId: regex }
      ]
    }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Your account is inactive. Please contact the administrator.' });
    }

    let isMatch = await user.comparePassword(rawPassword);
    if (!isMatch && rawPassword.trim() !== rawPassword) {
      isMatch = await user.comparePassword(rawPassword.trim());
    }
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Audit log (fail-safe)
    try {
      await AuditLog.create({
        user: user._id,
        userRole: user.role,
        action: 'User Login',
        module: 'auth',
        description: `${user.name} (${user.role}) logged in`,
        ipAddress: req.ip
      });
    } catch (auditErr) {
      console.warn('Login audit log skipped:', auditErr.message);
    }

    const token = generateToken(user._id);
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        userId: user.userId,
        username: user.username,
        employeeId: user.employeeId || user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        department: user.department,
        designation: user.designation,
        availability: user.availability || 'Available',
        themePreference: user.themePreference,
        notificationPreferences: user.notificationPreferences
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not retrieve profile.' });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    await AuditLog.create({
      user: req.user._id, userRole: req.user.role, action: 'User Logout',
      module: 'auth', description: `${req.user.name} logged out`, ipAddress: req.ip
    });
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Logout failed.' });
  }
};

// @desc    Update password
// @route   PUT /api/auth/password
// @access  Private
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new password.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }
    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }
    user.password = newPassword;
    await user.save();
    await AuditLog.create({
      user: req.user._id, userRole: req.user.role, action: 'Password Changed',
      module: 'auth', description: `${req.user.name} changed their password`
    });
    const token = generateToken(user._id);
    res.json({ success: true, message: 'Password updated successfully.', token });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Password update failed. Please try again.' });
  }
};

// @desc    Update profile (theme, notifications, etc.)
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, department, designation, themePreference, notificationPreferences } = req.body;
    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (department !== undefined) user.department = department;
    if (designation !== undefined) user.designation = designation;
    if (themePreference) user.themePreference = themePreference;
    if (notificationPreferences) user.notificationPreferences = notificationPreferences;
    await user.save();
    res.json({ success: true, message: 'Profile updated.', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Profile update failed.' });
  }
};
