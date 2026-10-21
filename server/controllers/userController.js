const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// @desc    Get all users (admin only)
// @route   GET /api/users
exports.getUsers = async (req, res) => {
  try {
    const { role, isActive, availability, search, page = 1, limit = 50 } = req.query;
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (availability) query.availability = availability;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { userId: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('createdBy', 'name userId'),
      User.countDocuments(query)
    ]);
    res.json({ success: true, count: users.length, total, pages: Math.ceil(total / parseInt(limit)), data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to retrieve users. Please try again.' });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('createdBy', 'name userId');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to retrieve user.' });
  }
};

// @desc    Create user (admin only)
// @route   POST /api/users
exports.createUser = async (req, res) => {
  try {
    let { name, username, employeeId, email, password, role, phone, department, designation, availability, isActive } = req.body;
    if (!name || !password || !role) {
      return res.status(400).json({ success: false, message: 'Name, password, and role are required.' });
    }

    if (!username && email) {
      username = email.split('@')[0].toLowerCase();
    } else if (username) {
      username = username.toLowerCase().trim();
    } else {
      username = name.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(100 + Math.random() * 900);
    }

    if (!email) {
      email = `${username}@minetrack.com`;
    } else {
      email = email.toLowerCase().trim();
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'A user with this email already exists.' });
    }
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'A user with this username already exists.' });
    }

    const user = await User.create({
      name,
      username,
      employeeId: employeeId || undefined,
      email,
      password,
      role,
      phone,
      department,
      designation,
      availability: availability || 'Available',
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user._id
    });

    await AuditLog.create({
      user: req.user._id,
      userRole: req.user.role,
      action: 'Create User',
      module: 'users',
      recordId: user.userId,
      description: `${req.user.name} created user ${user.name} (${user.userId} / @${user.username})`
    });

    res.status(201).json({ success: true, message: 'User created successfully.', data: user });
  } catch (error) {
    console.error('Create user error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Username, Email, or Employee ID already exists.' });
    }
    res.status(500).json({ success: false, message: error.message || 'Unable to create user. Please try again.' });
  }
};

// @desc    Update user (admin only)
// @route   PUT /api/users/:id
exports.updateUser = async (req, res) => {
  try {
    const { name, username, employeeId, email, role, phone, department, designation, isActive, availability } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const prev = { name: user.name, role: user.role, isActive: user.isActive, availability: user.availability };
    if (name) user.name = name;
    if (username) user.username = username.toLowerCase().trim();
    if (employeeId !== undefined) user.employeeId = employeeId;
    if (email) user.email = email.toLowerCase().trim();
    if (role) user.role = role;
    if (phone !== undefined) user.phone = phone;
    if (department !== undefined) user.department = department;
    if (designation !== undefined) user.designation = designation;
    if (isActive !== undefined) user.isActive = isActive;
    if (availability !== undefined) user.availability = availability;

    await user.save();
    await AuditLog.create({
      user: req.user._id,
      userRole: req.user.role,
      action: 'Update User',
      module: 'users',
      recordId: user.userId,
      description: `${req.user.name} updated user ${user.name} (${user.userId})`,
      previousValue: prev,
      newValue: { name: user.name, role: user.role, isActive: user.isActive, availability: user.availability }
    });

    res.json({ success: true, message: 'User updated successfully.', data: user });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Username, Email, or Employee ID already exists.' });
    }
    res.status(500).json({ success: false, message: 'Unable to update user.' });
  }
};

// @desc    Reset user password (admin only)
// @route   PUT /api/users/:id/reset-password
exports.resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    user.password = newPassword;
    await user.save();
    await AuditLog.create({
      user: req.user._id,
      userRole: req.user.role,
      action: 'Reset User Password',
      module: 'users',
      recordId: user.userId,
      description: `${req.user.name} reset password for ${user.name} (${user.userId})`
    });
    res.json({ success: true, message: 'Password reset successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Password reset failed.' });
  }
};

// @desc    Get workers list (for assignments)
// @route   GET /api/users/workers
exports.getWorkers = async (req, res) => {
  try {
    const workers = await User.find({ role: 'worker', isActive: true })
      .select('name userId username employeeId email department designation availability');
    res.json({ success: true, data: workers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to retrieve workers.' });
  }
};
