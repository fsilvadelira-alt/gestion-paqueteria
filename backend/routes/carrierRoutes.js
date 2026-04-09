const express = require('express');
const router = express.Router();
const { getCarriers, createCarrier, updateCarrier, deleteCarrier } = require('../controllers/carrierController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
    .get(protect, getCarriers)
    .post(protect, createCarrier);

router.route('/:id')
    .put(protect, updateCarrier)
    .delete(protect, deleteCarrier);

module.exports = router;
