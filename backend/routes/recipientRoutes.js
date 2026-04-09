const express = require('express');
const router = express.Router();
const { getRecipients, createRecipient, updateRecipient, deleteRecipient } = require('../controllers/recipientController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
    .get(protect, getRecipients)
    .post(protect, createRecipient);

router.route('/:id')
    .put(protect, updateRecipient)
    .delete(protect, deleteRecipient);

module.exports = router;
