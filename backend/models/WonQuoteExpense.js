const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Tabla pivot para vincular compras (Expense) a cotizaciones ganadas (WonQuote)
const WonQuoteExpense = sequelize.define('WonQuoteExpense', {
    wonQuoteId: { type: DataTypes.INTEGER, allowNull: false },
    expenseId: { type: DataTypes.INTEGER, allowNull: false }
}, {
    indexes: [
        {
            unique: true,
            fields: ['wonQuoteId', 'expenseId'] // Evitar duplicados
        }
    ]
});

module.exports = WonQuoteExpense;
