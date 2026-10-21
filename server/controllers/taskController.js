const Task = require('../models/Task');
const User = require('../models/User');
const Alert = require('../models/Alert');
const LeaveRequest = require('../models/LeaveRequest');
const AuditLog = require('../models/AuditLog');
const { sendNotification } = require('../utils/notify');

exports.getTasks = async (req, res) => {
  try {
    const { status, priority, assignedWorker, search, page = 1, limit = 50 } = req.query;
    const query = { isActive: true };
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedWorker) query.assignedWorker = assignedWorker;
    if (search) {
      query.$or = [
        { taskId: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    // Workers only see their tasks
    if (req.user.role === 'worker') query.assignedWorker = req.user._id;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [tasks, total] = await Promise.all([
      Task.find(query).sort({ dueDate: 1 }).skip(skip).limit(parseInt(limit))
        .populate('assignedWorker', 'name userId username availability')
        .populate('createdBy', 'name userId username')
        .populate('equipment', 'equipmentId name type status location'),
      Task.countDocuments(query)
    ]);
    res.json({ success: true, count: tasks.length, total, pages: Math.ceil(total / parseInt(limit)), data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to load tasks.' });
  }
};

exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedWorker', 'name userId username email phone availability')
      .populate('createdBy', 'name userId username')
      .populate('equipment', 'equipmentId name type status location')
      .populate('maintenance', 'maintenanceId maintenanceType status');
    if (!task || !task.isActive) return res.status(404).json({ success: false, message: 'Task not found.' });
    if (req.user.role === 'worker' && task.assignedWorker?._id?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You do not have permission to view this task.' });
    }
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to load task details.' });
  }
};

exports.createTask = async (req, res) => {
  try {
    if (req.user.role === 'worker') {
      return res.status(403).json({ success: false, message: 'Workers cannot create tasks.' });
    }
    const { assignedWorker, startDate, dueDate } = req.body;

    // Check worker availability
    if (assignedWorker) {
      const workerUser = await User.findById(assignedWorker);
      if (workerUser && (workerUser.availability === 'On Leave' || !workerUser.isActive)) {
        return res.status(400).json({
          success: false,
          workerUnavailable: true,
          message: 'Worker is currently on leave and cannot be assigned this task.'
        });
      }

      // Check leave requests conflict
      const leaveConflict = await LeaveRequest.findOne({
        worker: assignedWorker,
        status: 'Approved',
        $or: [
          {
            startDate: { $lte: dueDate ? new Date(dueDate) : new Date() },
            endDate: { $gte: startDate ? new Date(startDate) : new Date() }
          }
        ]
      }).populate('worker', 'name userId');

      if (leaveConflict) {
        return res.status(400).json({
          success: false,
          workerUnavailable: true,
          message: 'Worker is currently on leave and cannot be assigned this task.',
          leaveConflict: true
        });
      }
    }

    const task = await Task.create({
      ...req.body,
      status: req.body.status || 'Assigned',
      assignedDate: new Date(),
      createdBy: req.user._id
    });

    const populated = await Task.findById(task._id)
      .populate('assignedWorker', 'name userId username availability')
      .populate('equipment', 'equipmentId name');

    // Notify assigned worker in-app and push
    const eqInfo = populated?.equipment ? ` | Equipment: ${populated.equipment.equipmentId} - ${populated.equipment.name}` : '';
    await sendNotification({
      recipient: task.assignedWorker,
      type: 'task_assigned',
      title: `New Task Assigned: ${task.taskId}`,
      message: `Task: "${task.title}"${eqInfo} | Priority: ${task.priority} | Due Date: ${new Date(task.dueDate).toLocaleDateString('en-IN')}`,
      priority: task.priority || 'Medium',
      relatedRecordId: task._id,
      relatedRecordType: 'task',
      actionUrl: '/tasks',
      metadata: {
        taskId: task.taskId,
        priority: task.priority,
        dueDate: task.dueDate
      }
    });

    await AuditLog.create({
      user: req.user._id,
      userRole: req.user.role,
      action: 'Create Task',
      module: 'task',
      recordId: task.taskId,
      description: `${req.user.name} created and assigned task ${task.taskId} to ${populated?.assignedWorker?.name || 'worker'}`
    });

    res.status(201).json({ success: true, message: 'Task created and assigned successfully.', data: populated });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ success: false, message: 'Unable to create task.' });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task || !task.isActive) return res.status(404).json({ success: false, message: 'Task not found.' });
    if (req.user.role === 'worker' && task.assignedWorker?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only update your own tasks.' });
    }

    // Workers can't reassign tasks or modify priority
    if (req.user.role === 'worker') {
      delete req.body.assignedWorker;
      delete req.body.priority;
    }

    const prevStatus = task.status;
    Object.assign(task, req.body);

    if (req.body.status === 'Completed') task.completedDate = new Date();
    if (req.body.status === 'In Progress' && !task.startDate) task.startDate = new Date();
    if (req.body.status === 'Acknowledged' && !task.acknowledgedDate) task.acknowledgedDate = new Date();

    await task.save();

    await AuditLog.create({
      user: req.user._id,
      userRole: req.user.role,
      action: 'Update Task',
      module: 'task',
      recordId: task.taskId,
      description: `${req.user.name} updated task ${task.taskId}`,
      previousValue: { status: prevStatus },
      newValue: { status: task.status }
    });

    const populated = await Task.findById(task._id)
      .populate('assignedWorker', 'name userId username availability')
      .populate('equipment', 'equipmentId name');

    res.json({ success: true, message: 'Task updated.', data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to update task.' });
  }
};

// @desc    Worker acknowledges task
// @route   PUT /api/tasks/:id/acknowledge
exports.acknowledgeTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task || !task.isActive) return res.status(404).json({ success: false, message: 'Task not found.' });
    if (req.user.role === 'worker' && task.assignedWorker?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only acknowledge your own tasks.' });
    }

    task.status = 'Acknowledged';
    task.acknowledgedDate = new Date();
    if (req.body.remarks) {
      task.remarks = req.body.remarks;
      task.workerRemarks = req.body.remarks;
    }
    await task.save();

    // Notify supervisor that task was acknowledged
    if (task.createdBy) {
      await sendNotification({
        recipient: task.createdBy,
        type: 'task_acknowledged',
        title: `Task Acknowledged: ${task.taskId}`,
        message: `${req.user.name} acknowledged assigned task: "${task.title}".`,
        priority: task.priority || 'Medium',
        relatedRecordId: task._id,
        relatedRecordType: 'task',
        actionUrl: '/tasks'
      });
    }

    await AuditLog.create({
      user: req.user._id,
      userRole: req.user.role,
      action: 'Acknowledge Task',
      module: 'task',
      recordId: task.taskId,
      description: `${req.user.name} acknowledged task ${task.taskId}`
    });

    const populated = await Task.findById(task._id)
      .populate('assignedWorker', 'name userId username')
      .populate('equipment', 'equipmentId name');

    res.json({ success: true, message: 'Task acknowledged.', data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to acknowledge task.' });
  }
};

// @desc    Worker starts task
// @route   PUT /api/tasks/:id/start
exports.startTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task || !task.isActive) return res.status(404).json({ success: false, message: 'Task not found.' });
    if (req.user.role === 'worker' && task.assignedWorker?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only start your own tasks.' });
    }

    task.status = 'In Progress';
    if (!task.startDate) task.startDate = new Date();
    if (req.body.remarks) {
      task.remarks = req.body.remarks;
      task.workerRemarks = req.body.remarks;
    }
    await task.save();

    // Notify supervisor that work started
    if (task.createdBy) {
      await sendNotification({
        recipient: task.createdBy,
        type: 'task_started',
        title: `Task Started: ${task.taskId}`,
        message: `${req.user.name} started work on task: "${task.title}".`,
        priority: task.priority || 'Medium',
        relatedRecordId: task._id,
        relatedRecordType: 'task',
        actionUrl: '/tasks'
      });
    }

    await AuditLog.create({
      user: req.user._id,
      userRole: req.user.role,
      action: 'Start Task',
      module: 'task',
      recordId: task.taskId,
      description: `${req.user.name} started task ${task.taskId}`
    });

    const populated = await Task.findById(task._id)
      .populate('assignedWorker', 'name userId username')
      .populate('equipment', 'equipmentId name');

    res.json({ success: true, message: 'Task marked In Progress.', data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to start task.' });
  }
};

// @desc    Worker completes task
// @route   PUT /api/tasks/:id/complete
exports.completeTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task || !task.isActive) return res.status(404).json({ success: false, message: 'Task not found.' });
    if (req.user.role === 'worker' && task.assignedWorker?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only complete your own tasks.' });
    }

    task.status = 'Completed';
    task.completedDate = new Date();
    task.progressPercentage = 100;
    if (req.body.remarks) {
      task.remarks = req.body.remarks;
      task.workerRemarks = req.body.remarks;
    }
    await task.save();

    // Notify supervisor that task was completed
    if (task.createdBy) {
      await sendNotification({
        recipient: task.createdBy,
        type: 'task_completed',
        title: `Task Completed: ${task.taskId}`,
        message: `${req.user.name} has completed task: "${task.title}". Ready for supervisor review.`,
        priority: task.priority || 'Medium',
        relatedRecordId: task._id,
        relatedRecordType: 'task',
        actionUrl: '/tasks'
      });
    }

    await AuditLog.create({
      user: req.user._id,
      userRole: req.user.role,
      action: 'Complete Task',
      module: 'task',
      recordId: task.taskId,
      description: `${req.user.name} completed task ${task.taskId}`
    });

    const populated = await Task.findById(task._id)
      .populate('assignedWorker', 'name userId username')
      .populate('equipment', 'equipmentId name');

    res.json({ success: true, message: 'Task completed successfully.', data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to complete task.' });
  }
};

// @desc    Add remarks to task
// @route   PUT /api/tasks/:id/remarks
exports.addRemarks = async (req, res) => {
  try {
    const { remarks } = req.body;
    if (!remarks) return res.status(400).json({ success: false, message: 'Remarks are required.' });

    const task = await Task.findById(req.params.id);
    if (!task || !task.isActive) return res.status(404).json({ success: false, message: 'Task not found.' });

    if (req.user.role === 'worker') {
      task.workerRemarks = remarks;
    } else {
      task.supervisorRemarks = remarks;
    }
    task.remarks = remarks;
    await task.save();

    res.json({ success: true, message: 'Remarks added.', data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to add remarks.' });
  }
};

// @desc    Supervisor reassigns task
// @route   PUT /api/tasks/:id/reassign
exports.reassignTask = async (req, res) => {
  try {
    if (!['admin', 'supervisor'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only supervisors can reassign tasks.' });
    }
    const { assignedWorker, remarks } = req.body;
    if (!assignedWorker) return res.status(400).json({ success: false, message: 'Assigned worker is required.' });

    const workerUser = await User.findById(assignedWorker);
    if (!workerUser || !workerUser.isActive) {
      return res.status(400).json({
        success: false,
        workerUnavailable: true,
        message: 'Worker is currently on leave and cannot be assigned this task.'
      });
    }
    if (workerUser.availability === 'On Leave') {
      return res.status(400).json({
        success: false,
        workerUnavailable: true,
        message: 'Worker is currently on leave and cannot be assigned this task.'
      });
    }

    const task = await Task.findById(req.params.id);
    if (!task || !task.isActive) return res.status(404).json({ success: false, message: 'Task not found.' });

    task.assignedWorker = assignedWorker;
    task.status = 'Assigned';
    if (remarks) task.supervisorRemarks = remarks;
    await task.save();

    // Notify newly assigned worker
    await Alert.create({
      type: 'task_assigned',
      title: `Task Reassigned: ${task.taskId}`,
      message: `Task "${task.title}" has been reassigned to you. Due date: ${new Date(task.dueDate).toLocaleDateString('en-IN')}`,
      priority: task.priority || 'Medium',
      targetUser: workerUser._id,
      relatedModule: 'task',
      relatedId: task._id
    });

    const populated = await Task.findById(task._id)
      .populate('assignedWorker', 'name userId username availability')
      .populate('equipment', 'equipmentId name');

    res.json({ success: true, message: `Task reassigned to ${workerUser.name}.`, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to reassign task.' });
  }
};

// @desc    Supervisor reschedules task
// @route   PUT /api/tasks/:id/reschedule
exports.rescheduleTask = async (req, res) => {
  try {
    if (!['admin', 'supervisor'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only supervisors can reschedule tasks.' });
    }
    const { dueDate, startDate, remarks } = req.body;
    if (!dueDate) return res.status(400).json({ success: false, message: 'New due date is required.' });

    const task = await Task.findById(req.params.id);
    if (!task || !task.isActive) return res.status(404).json({ success: false, message: 'Task not found.' });

    task.dueDate = new Date(dueDate);
    if (startDate) task.startDate = new Date(startDate);
    if (remarks) task.supervisorRemarks = remarks;
    if (task.status === 'Overdue') task.status = 'Assigned';

    await task.save();

    const populated = await Task.findById(task._id)
      .populate('assignedWorker', 'name userId username availability')
      .populate('equipment', 'equipmentId name');

    res.json({ success: true, message: 'Task rescheduled successfully.', data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to reschedule task.' });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
    task.isActive = false;
    await task.save();
    res.json({ success: true, message: 'Task deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to delete task.' });
  }
};
