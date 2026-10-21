const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized to access this route. Please login.' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User account not found. Token may be invalid.' });
    }
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Your account has been deactivated. Contact administrator.' });
    }
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid authentication token. Please login again.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Your session has expired. Please login again.' });
    }
    return res.status(500).json({ success: false, message: 'Authentication error. Please try again.' });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `You do not have permission to perform this action. Required role: ${roles.join(' or ')}.`
      });
    }
    next();
  };
};
