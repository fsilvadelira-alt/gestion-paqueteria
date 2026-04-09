const express = require('express');
const router = express.Router();
const { getCompanies, createCompany, updateCompany, deleteCompany } = require('../controllers/companyController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, getCompanies);
router.post('/', protect, createCompany);
router.put('/:id', protect, updateCompany);
router.delete('/:id', protect, deleteCompany);

module.exports = router;
