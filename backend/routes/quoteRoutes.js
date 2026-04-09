const express = require('express');
const router = express.Router();
const { 
    getQuotes, createQuote, updateQuote, deleteQuote,
    markAsWon, markAsLost, recoverQuote,
    getWonQuotes, updateWonQuote, linkPackage, unlinkPackage,
    closeQuote, addOperationalExpense, deleteOperationalExpense, getOperationalExpenses, getQuoteHistory
} = require('../controllers/quoteController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

// IMPORTANTE: Rutas de Servicios Generales PRIMERO (antes de /:id)
// para evitar que "won" sea interpretado como un :id parámetro
router.get('/won', protect, adminOnly, getWonQuotes);
router.put('/won/:id', protect, adminOnly, updateWonQuote);
router.post('/won/:wonQuoteId/packages', protect, adminOnly, linkPackage);
router.delete('/won/:wonQuoteId/packages/:packageId', protect, adminOnly, unlinkPackage);
router.post('/won/:id/close', protect, adminOnly, closeQuote);

// Rutas de Gastos Operativos (ligados a WonQuote)
router.get('/operational-expenses', protect, adminOnly, getOperationalExpenses);
router.post('/operational-expenses', protect, adminOnly, addOperationalExpense);
router.delete('/operational-expenses/:id', protect, adminOnly, deleteOperationalExpense);

// Rutas principales de cotizaciones
router.get('/history', protect, adminOnly, getQuoteHistory);
router.get('/', protect, getQuotes);
router.post('/', protect, createQuote);
router.put('/:id', protect, updateQuote);
router.delete('/:id', protect, adminOnly, deleteQuote);

// Cambio de estado (solo Admin)
router.post('/:id/won', protect, adminOnly, markAsWon);
router.post('/:id/lost', protect, adminOnly, markAsLost);
router.post('/:id/recover', protect, adminOnly, recoverQuote);

module.exports = router;
