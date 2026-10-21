/**
 * Background Alert Scheduler for MineTrack
 * Periodically checks tasks, maintenance, and worker availability to generate alerts.
 * Prevents duplicates by checking existing active alerts for related records.
 */
const Task = require('../models/Task');
const Maintenance = require('../models/Maintenance');
const Alert = require('../models/Alert');
const User = require('../models/User');

async function runAlertChecks() {
  try {
    const now = new Date();
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const next48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // 1. Check Overdue Tasks
    const overdueTasks = await Task.find({
      isActive: true,
      dueDate: { $lt: now },
      status: { $in: ['Assigned', 'Acknowledged', 'In Progress', 'Pending', 'Not Seen'] }
    });

    for (const task of overdueTasks) {
      task.status = 'Overdue';
      await task.save();

      const existingAlert = await Alert.findOne({
        type: 'task_overdue',
        relatedId: task._id,
        status: { $in: ['Active', 'Acknowledged'] }
      });

      if (!existingAlert) {
        await Alert.create({
          type: 'task_overdue',
          title: `Task Overdue: ${task.taskId}`,
          message: `Task "${task.title}" was due on ${task.dueDate.toLocaleDateString('en-IN')} and is now overdue.`,
          priority: 'High',
          severity: 'warning',
          targetRole: 'supervisor',
          relatedModule: 'task',
          relatedId: task._id
        });
      }
    }

    // 2. Check Tasks Due Soon (within 24 hours)
    const dueSoonTasks = await Task.find({
      isActive: true,
      dueDate: { $gte: now, $lte: next24h },
      status: { $in: ['Assigned', 'Acknowledged', 'In Progress'] }
    });

    for (const task of dueSoonTasks) {
      const existingAlert = await Alert.findOne({
        type: 'task_due_soon',
        relatedId: task._id,
        status: { $in: ['Active', 'Acknowledged'] }
      });

      if (!existingAlert) {
        await Alert.create({
          type: 'task_due_soon',
          title: `Task Due Soon: ${task.taskId}`,
          message: `Task "${task.title}" is due within 24 hours (${task.dueDate.toLocaleDateString('en-IN')}).`,
          priority: 'Medium',
          severity: 'info',
          targetUser: task.assignedWorker,
          relatedModule: 'task',
          relatedId: task._id
        });
      }
    }

    // 3. Check Unacknowledged Tasks (Assigned > 2 hours ago)
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const unacknowledgedTasks = await Task.find({
      isActive: true,
      status: 'Assigned',
      createdAt: { $lt: twoHoursAgo }
    }).populate('assignedWorker', 'name userId');

    for (const task of unacknowledgedTasks) {
      const existingAlert = await Alert.findOne({
        type: 'task_not_seen',
        relatedId: task._id,
        status: { $in: ['Active', 'Acknowledged'] }
      });

      if (!existingAlert) {
        await Alert.create({
          type: 'task_not_seen',
          title: `Task Not Acknowledged: ${task.taskId}`,
          message: `Task "${task.title}" assigned to ${task.assignedWorker?.name || 'worker'} has not been acknowledged after 2+ hours.`,
          priority: 'Medium',
          severity: 'warning',
          targetRole: 'supervisor',
          relatedModule: 'task',
          relatedId: task._id
        });
      }
    }

    // 4. Check Overdue Maintenance
    const overdueMaintenance = await Maintenance.find({
      isActive: true,
      scheduledDate: { $lt: now },
      status: { $in: ['Scheduled', 'Pending'] }
    }).populate('equipment', 'equipmentId name');

    for (const maint of overdueMaintenance) {
      maint.status = 'Overdue';
      await maint.save();

      const existingAlert = await Alert.findOne({
        type: 'maintenance_overdue',
        relatedId: maint._id,
        status: { $in: ['Active', 'Acknowledged'] }
      });

      if (!existingAlert) {
        await Alert.create({
          type: 'maintenance_overdue',
          title: `Maintenance Overdue: ${maint.maintenanceId}`,
          message: `Maintenance ${maint.maintenanceId} for ${maint.equipment?.name || 'equipment'} was scheduled for ${maint.scheduledDate.toLocaleDateString('en-IN')} and is overdue.`,
          priority: 'High',
          severity: 'critical',
          targetRole: 'supervisor',
          relatedModule: 'maintenance',
          relatedId: maint._id
        });
      }
    }

    // 5. Check Maintenance Due Soon (within 48 hours)
    const dueSoonMaintenance = await Maintenance.find({
      isActive: true,
      scheduledDate: { $gte: now, $lte: next48h },
      status: 'Scheduled'
    }).populate('equipment', 'equipmentId name');

    for (const maint of dueSoonMaintenance) {
      const existingAlert = await Alert.findOne({
        type: 'maintenance_due',
        relatedId: maint._id,
        status: { $in: ['Active', 'Acknowledged'] }
      });

      if (!existingAlert) {
        await Alert.create({
          type: 'maintenance_due',
          title: `Maintenance Due: ${maint.maintenanceId}`,
          message: `Maintenance ${maint.maintenanceId} for ${maint.equipment?.name || 'equipment'} is scheduled on ${maint.scheduledDate.toLocaleDateString('en-IN')}.`,
          priority: 'Medium',
          severity: 'warning',
          targetRole: 'supervisor',
          relatedModule: 'maintenance',
          relatedId: maint._id
        });
      }
    }

    // 6. Check Worker Unavailability affecting active tasks
    const activeTasksWithWorker = await Task.find({
      isActive: true,
      status: { $in: ['Assigned', 'Acknowledged', 'In Progress'] }
    }).populate('assignedWorker', 'name userId availability isActive');

    for (const task of activeTasksWithWorker) {
      const worker = task.assignedWorker;
      if (worker && (worker.availability === 'On Leave' || !worker.isActive)) {
        const existingAlert = await Alert.findOne({
          type: 'worker_unavailable',
          relatedId: task._id,
          status: { $in: ['Active', 'Acknowledged'] }
        });

        if (!existingAlert) {
          await Alert.create({
            type: 'worker_unavailable',
            title: `Worker Unavailable: ${task.taskId}`,
            message: `Worker ${worker.name} (${worker.userId}) assigned to task "${task.title}" is currently on leave / inactive. Reassignment or rescheduling is required.`,
            priority: 'High',
            severity: 'warning',
            targetRole: 'supervisor',
            relatedModule: 'task',
            relatedId: task._id
          });
        }
      }
    }
  } catch (error) {
    console.error('Alert background scheduler error:', error.message);
  }
}

function startAlertScheduler(intervalMs = 60000) {
  // Run on startup after 3 seconds
  setTimeout(runAlertChecks, 3000);
  // Recurring interval
  const timer = setInterval(runAlertChecks, intervalMs);
  return timer;
}

module.exports = { runAlertChecks, startAlertScheduler };
