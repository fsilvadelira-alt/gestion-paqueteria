const express = require('express');
const router = express.Router();
const { exportPackages, exportAllData } = require('../controllers/exportController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/packages', protect, exportPackages);
router.get('/all', protect, exportAllData);

module.exports = router;
