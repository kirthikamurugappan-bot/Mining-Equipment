const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const app = express();

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/users',      require('./routes/users'));
app.use('/api/equipment',  require('./routes/equipment'));
app.use('/api/tyres',      require('./routes/tyres'));
app.use('/api/maintenance',require('./routes/maintenance'));
app.use('/api/tasks',      require('./routes/tasks'));
app.use('/api/issues',     require('./routes/issues'));
app.use('/api/alerts',        require('./routes/alerts'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/attendance',    require('./routes/attendance'));
app.use('/api/leave',      require('./routes/leave'));
app.use('/api/bills',      require('./routes/bills'));
app.use('/api/reports',    require('./routes/reports'));
app.use('/api/audit',      require('./routes/audit'));
app.use('/api/settings',   require('./routes/settings'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'MineTrack API is running', timestamp: new Date() });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global Error:', err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;
const { startAlertScheduler } = require('./services/alertScheduler');

const server = app.listen(PORT, () => {
  console.log(`\n🚀 MineTrack Server running on port ${PORT} [${process.env.NODE_ENV}]`);
  console.log(`📡 API: http://localhost:${PORT}/api/health\n`);
  startAlertScheduler(60000);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

module.exports = app;
