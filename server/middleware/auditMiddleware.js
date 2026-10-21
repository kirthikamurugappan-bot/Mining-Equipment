const AuditLog = require('../models/AuditLog');

const audit = (action, module) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = async (body) => {
      if (body && body.success && req.user) {
        try {
          await AuditLog.create({
            user: req.user._id,
            userRole: req.user.role,
            action,
            module,
            recordId: body.data?._id || body.data?.id || req.params.id,
            description: `${req.user.name} (${req.user.role}) performed: ${action}`,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
          });
        } catch (err) {
          console.error('Audit log error:', err.message);
        }
      }
      return originalJson(body);
    };
    next();
  };
};

module.exports = audit;
