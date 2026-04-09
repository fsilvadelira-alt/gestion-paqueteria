const express = require('express');
const router = express.Router();
const { getLogistics, createLogistics, updateLogistics, deleteLogistics } = require('../controllers/logisticsController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
    .get(protect, getLogistics)
    .post(protect, createLogistics);

router.route('/:id')
    .put(protect, updateLogistics)
    .delete(protect, deleteLogistics);

module.exports = router;
