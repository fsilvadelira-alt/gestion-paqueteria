const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Expense = sequelize.define('Expense', {
    date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    concept: { type: DataTypes.STRING, allowNull: false },
    amount: { type: DataTypes.FLOAT, allowNull: false },
    description: { type: DataTypes.TEXT },
    isFacturado: { type: DataTypes.BOOLEAN, defaultValue: false },
    type: { type: DataTypes.ENUM('ingreso', 'gasto'), defaultValue: 'gasto' },
    receiver: { type: DataTypes.STRING }
});

module.exports = Expense;
