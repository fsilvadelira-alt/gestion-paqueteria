const express = require('express');
const router = express.Router();
const { getPackages, createPackage, updatePackage, deletePackage, searchPackageByTracking } = require('../controllers/packageController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
    .get(protect, getPackages)
    .post(protect, createPackage);

router.get('/tracking/:tracking', protect, searchPackageByTracking);

router.route('/:id')
    .put(protect, updatePackage)
    .delete(protect, deletePackage);

module.exports = router;
