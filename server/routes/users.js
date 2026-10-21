const express = require('express');
const router = express.Router();
const { getUsers, getUser, createUser, updateUser, resetUserPassword, getWorkers } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/workers', getWorkers);
router.get('/', authorize('admin'), getUsers);
router.get('/:id', authorize('admin'), getUser);
router.post('/', authorize('admin'), createUser);
router.put('/:id', authorize('admin'), updateUser);
router.put('/:id/reset-password', authorize('admin'), resetUserPassword);

module.exports = router;
