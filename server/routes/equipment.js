const express = require('express');
const router = express.Router();
const { getEquipment, getEquipmentById, createEquipment, updateEquipment, deleteEquipment } = require('../controllers/equipmentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', getEquipment);
router.get('/:id', getEquipmentById);
router.post('/', authorize('admin', 'supervisor'), createEquipment);
router.put('/:id', authorize('admin', 'supervisor'), updateEquipment);
router.delete('/:id', authorize('admin'), deleteEquipment);

module.exports = router;
