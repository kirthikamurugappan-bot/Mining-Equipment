const express = require('express');
const router = express.Router();
const {
  getIssues,
  getIssueById,
  reportIssue,
  reviewIssue,
  deleteIssue
} = require('../controllers/issueController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

router.get('/', getIssues);
router.get('/:id', getIssueById);
router.post('/', upload.single('photo'), reportIssue);
router.put('/:id/review', authorize('admin', 'supervisor'), reviewIssue);
router.delete('/:id', authorize('admin', 'supervisor'), deleteIssue);

module.exports = router;
