const mongoose = require('mongoose');
const Maintenance = require('../models/Maintenance');
const Equipment = require('../models/Equipment');
const Tyre = require('../models/Tyre');
const Task = require('../models/Task');
const Bill = require('../models/Bill');
const User = require('../models/User');
const Alert = require('../models/Alert');

// @desc    Dashboard stats
// @route   GET /api/reports/dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalEquipment, operationalEq, underMaintenanceEq, inactiveEq,
      totalTyres, criticalTyres, wornTyres,
      totalMaintenance, completedMaintenance, overdueMaintenance, pendingMaintenance,
      totalTasks, completedTasks, overdueTasks, inProgressTasks,
      totalAlerts, unreadAlerts, costMismatchAlerts,
      totalUsers, totalWorkers, activeWorkers, onLeaveWorkers
    ] = await Promise.all([
      Equipment.countDocuments({ isActive: true }),
      Equipment.countDocuments({ isActive: true, status: 'Operational' }),
      Equipment.countDocuments({ isActive: true, status: 'Under Maintenance' }),
      Equipment.countDocuments({ isActive: true, status: 'Inactive' }),
      Tyre.countDocuments({ isActive: true }),
      Tyre.countDocuments({ isActive: true, condition: { $in: ['Critical', 'Replacement Required'] } }),
      Tyre.countDocuments({ isActive: true, condition: { $in: ['Worn', 'Warning'] } }),
      Maintenance.countDocuments({ isActive: true }),
      Maintenance.countDocuments({ isActive: true, status: 'Completed' }),
      Maintenance.countDocuments({ isActive: true, status: 'Overdue' }),
      Maintenance.countDocuments({ isActive: true, status: { $in: ['Scheduled', 'Pending'] } }),
      Task.countDocuments({ isActive: true }),
      Task.countDocuments({ isActive: true, status: 'Completed' }),
      Task.countDocuments({ isActive: true, status: 'Overdue' }),
      Task.countDocuments({ isActive: true, status: 'In Progress' }),
      Alert.countDocuments({ isActive: true }),
      Alert.countDocuments({ isActive: true, isRead: false }),
      Alert.countDocuments({ isActive: true, type: 'cost_mismatch', isRead: false }),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: true, role: 'worker' }),
      User.countDocuments({ isActive: true, role: 'worker', availability: 'Available' }),
      User.countDocuments({ isActive: true, role: 'worker', availability: 'On Leave' })
    ]);

    // Total maintenance cost
    const costAgg = await Maintenance.aggregate([
      { $match: { isActive: true, status: 'Completed' } },
      { $group: { _id: null, totalCost: { $sum: '$totalCost' } } }
    ]);
    const totalMaintenanceCost = costAgg[0]?.totalCost || 0;

    // Cost mismatch count
    const costMismatchesCount = await Maintenance.countDocuments({
      isActive: true,
      costStatus: 'Cost Mismatch'
    });

    // Recent maintenance
    const recentMaintenance = await Maintenance.find({ isActive: true })
      .sort({ updatedAt: -1 }).limit(5)
      .populate('equipment', 'equipmentId name type status location')
      .populate('assignedWorker', 'name userId username')
      .select('maintenanceId maintenanceType status scheduledDate enteredCost billCost variance costStatus totalCost');

    // Recent alerts
    const recentAlerts = await Alert.find({ isActive: true, isRead: false })
      .sort({ createdAt: -1 }).limit(5);

    res.json({
      success: true,
      data: {
        equipment: { total: totalEquipment, operational: operationalEq, underMaintenance: underMaintenanceEq, inactive: inactiveEq },
        tyres: { total: totalTyres, critical: criticalTyres, worn: wornTyres },
        maintenance: {
          total: totalMaintenance,
          completed: completedMaintenance,
          overdue: overdueMaintenance,
          pending: pendingMaintenance,
          totalCost: totalMaintenanceCost,
          costMismatches: costMismatchesCount
        },
        tasks: { total: totalTasks, completed: completedTasks, overdue: overdueTasks, inProgress: inProgressTasks },
        alerts: { total: totalAlerts, unread: unreadAlerts, costMismatches: costMismatchAlerts },
        users: { total: totalUsers, workers: totalWorkers, activeWorkers, onLeaveWorkers },
        recentMaintenance,
        recentAlerts
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: 'Unable to load dashboard data.' });
  }
};

// @desc    Full analytics report for Reports page + PDF
// @route   GET /api/reports/analytics
exports.getAnalytics = async (req, res) => {
  try {
    const { year = new Date().getFullYear(), month, equipment, maintenanceType, status } = req.query;
    const matchQuery = { isActive: true };

    const selectedYear = parseInt(year);
    if (month && parseInt(month) > 0) {
      const selectedMonth = parseInt(month);
      const start = new Date(selectedYear, selectedMonth - 1, 1);
      const end = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);
      matchQuery.scheduledDate = { $gte: start, $lte: end };
    } else {
      const start = new Date(selectedYear, 0, 1);
      const end = new Date(selectedYear, 11, 31, 23, 59, 59, 999);
      matchQuery.scheduledDate = { $gte: start, $lte: end };
    }

    if (equipment) matchQuery.equipment = new mongoose.Types.ObjectId(equipment);
    if (maintenanceType) matchQuery.maintenanceType = maintenanceType;
    if (status) matchQuery.status = status;

    const [
      summaryAgg,
      monthlyJobsRaw,
      monthlyCostRaw,
      maintenanceTypeDistribution,
      equipmentCostRaw,
      tyreConditionDistribution,
      costStatusDistribution,
      tableRecords
    ] = await Promise.all([
      // Summary cards
      Maintenance.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalJobs: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $in: ['$status', ['Scheduled', 'Pending', 'In Progress']] }, 1, 0] } },
            overdue: { $sum: { $cond: [{ $eq: ['$status', 'Overdue'] }, 1, 0] } },
            totalCost: { $sum: '$totalCost' },
            costMismatchAmount: {
              $sum: {
                $cond: [
                  { $eq: ['$costStatus', 'Cost Mismatch'] },
                  { $abs: { $ifNull: ['$variance', 0] } },
                  0
                ]
              }
            },
            uniqueEquipment: { $addToSet: '$equipment' },
            uniqueTyres: { $addToSet: '$tyre' }
          }
        }
      ]),
      // 1. Monthly Job Volume Trend
      Maintenance.aggregate([
        { $match: { isActive: true, scheduledDate: { $gte: new Date(selectedYear, 0, 1), $lte: new Date(selectedYear, 11, 31, 23, 59, 59) } } },
        {
          $group: {
            _id: { $month: '$scheduledDate' },
            total: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
            overdue: { $sum: { $cond: [{ $eq: ['$status', 'Overdue'] }, 1, 0] } }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      // 2. Monthly Maintenance Cost
      Maintenance.aggregate([
        { $match: { isActive: true, scheduledDate: { $gte: new Date(selectedYear, 0, 1), $lte: new Date(selectedYear, 11, 31, 23, 59, 59) } } },
        {
          $group: {
            _id: { $month: '$scheduledDate' },
            cost: { $sum: '$totalCost' }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      // 3. Maintenance Type Distribution
      Maintenance.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$maintenanceType', count: { $sum: 1 }, totalCost: { $sum: '$totalCost' } } }
      ]),
      // 4. Equipment-wise Cost
      Maintenance.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$equipment', totalCost: { $sum: '$totalCost' }, count: { $sum: 1 } } },
        { $lookup: { from: 'equipment', localField: '_id', foreignField: '_id', as: 'eq' } },
        { $unwind: { path: '$eq', preserveNullAndEmptyArrays: true } },
        { $sort: { totalCost: -1 } },
        { $limit: 8 },
        { $project: { name: '$eq.name', equipmentId: '$eq.equipmentId', totalCost: 1, count: 1 } }
      ]),
      // 5. Tyre Condition Distribution
      Tyre.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$condition', count: { $sum: 1 } } }
      ]),
      // 6. Cost Mismatch Summary Breakdown
      Maintenance.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$costStatus', count: { $sum: 1 }, totalVariance: { $sum: { $abs: '$variance' } } } }
      ]),
      // 7. Table records for report
      Maintenance.find(matchQuery)
        .sort({ scheduledDate: -1 })
        .limit(100)
        .populate('equipment', 'equipmentId name type')
        .populate('assignedWorker', 'name userId')
    ]);

    const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthlyJobVolume = MONTH_NAMES.map((m, i) => {
      const found = monthlyJobsRaw.find(d => d._id === i + 1);
      return {
        month: m,
        total: found?.total || 0,
        completed: found?.completed || 0,
        overdue: found?.overdue || 0
      };
    });

    const monthlyCost = MONTH_NAMES.map((m, i) => {
      const found = monthlyCostRaw.find(d => d._id === i + 1);
      return {
        month: m,
        cost: found?.cost || 0
      };
    });

    const summary = summaryAgg[0] || {
      totalJobs: 0,
      completed: 0,
      pending: 0,
      overdue: 0,
      totalCost: 0,
      costMismatchAmount: 0,
      uniqueEquipment: [],
      uniqueTyres: []
    };

    const statusDistribution = [
      { name: 'Completed', value: summary.completed, color: '#16A34A' },
      { name: 'Pending / In Progress', value: summary.pending, color: '#F59E0B' },
      { name: 'Overdue', value: summary.overdue, color: '#DC2626' }
    ];

    res.json({
      success: true,
      data: {
        filters: { year: selectedYear, month: month ? parseInt(month) : null },
        summary: {
          totalJobs: summary.totalJobs,
          completed: summary.completed,
          pending: summary.pending,
          overdue: summary.overdue,
          totalCost: summary.totalCost,
          costMismatchAmount: summary.costMismatchAmount,
          equipmentServiced: (summary.uniqueEquipment || []).filter(Boolean).length,
          tyresServiced: (summary.uniqueTyres || []).filter(Boolean).length
        },
        charts: {
          monthlyJobVolume,
          monthlyCost,
          equipmentCost: equipmentCostRaw.map(e => ({
            name: e.name || e.equipmentId || 'Unknown',
            equipmentId: e.equipmentId,
            cost: e.totalCost,
            count: e.count
          })),
          maintenanceTypeDistribution: maintenanceTypeDistribution.map(t => ({
            name: t._id,
            count: t.count,
            totalCost: t.totalCost
          })),
          statusDistribution,
          tyreConditionDistribution: tyreConditionDistribution.map(tc => ({
            name: tc._id,
            count: tc.count
          })),
          costMismatchSummary: costStatusDistribution.map(cs => ({
            name: cs._id,
            count: cs.count,
            totalVariance: cs.totalVariance || 0
          }))
        },
        records: tableRecords
      }
    });
  } catch (error) {
    console.error('Analytics report error:', error);
    res.status(500).json({ success: false, message: 'Unable to generate analytics.' });
  }
};

// @desc    Monthly maintenance report alias
// @route   GET /api/reports/monthly
exports.getMonthlyReport = async (req, res) => {
  return exports.getAnalytics(req, res);
};

