const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const OperationalExpense = sequelize.define('OperationalExpense', {
    description: { type: DataTypes.STRING, allowNull: false },
    amount: { type: DataTypes.FLOAT, allowNull: false },
    date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    // wonQuoteId is managed by relationship
});

module.exports = OperationalExpense;
