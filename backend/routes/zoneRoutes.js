const express = require('express');
const router = express.Router();
const { getZones, createZone, updateZone, deleteZone } = require('../controllers/zoneController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, getZones);
router.post('/', protect, createZone);
router.put('/:id', protect, updateZone);
router.delete('/:id', protect, deleteZone);

module.exports = router;
