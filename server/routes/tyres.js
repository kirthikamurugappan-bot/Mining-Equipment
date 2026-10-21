const express = require('express');
const router = express.Router();
const { getTyres, getTyre, createTyre, updateTyre, inspectTyre, deleteTyre } = require('../controllers/tyreController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', getTyres);
router.get('/:id', getTyre);
router.post('/', authorize('admin', 'supervisor'), createTyre);
router.put('/:id', authorize('admin', 'supervisor'), updateTyre);
router.post('/:id/inspect', authorize('admin', 'supervisor'), inspectTyre);
router.delete('/:id', authorize('admin'), deleteTyre);

module.exports = router;
