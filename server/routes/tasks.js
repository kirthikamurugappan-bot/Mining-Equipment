const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  acknowledgeTask,
  startTask,
  completeTask,
  addRemarks,
  reassignTask,
  rescheduleTask,
  deleteTask
} = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getTasks);
router.get('/:id', getTask);
router.post('/', authorize('admin', 'supervisor'), createTask);
router.put('/:id', updateTask);
router.put('/:id/acknowledge', acknowledgeTask);
router.put('/:id/start', startTask);
router.put('/:id/complete', completeTask);
router.put('/:id/remarks', addRemarks);
router.put('/:id/reassign', authorize('admin', 'supervisor'), reassignTask);
router.put('/:id/reschedule', authorize('admin', 'supervisor'), rescheduleTask);
router.delete('/:id', authorize('admin', 'supervisor'), deleteTask);

module.exports = router;
