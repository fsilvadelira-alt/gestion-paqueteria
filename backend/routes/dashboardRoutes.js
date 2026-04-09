const express = require('express');
const router = express.Router();
const { getDashboardStats, getChartData } = require('../controllers/dashboardController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/stats', protect, getDashboardStats);
router.get('/charts', protect, getChartData);

module.exports = router;
