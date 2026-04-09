const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Logistics = sequelize.define('Logistics', {
    name: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING },
    website: { type: DataTypes.STRING },
    notes: { type: DataTypes.TEXT },
    email: { type: DataTypes.STRING },
    address: { type: DataTypes.TEXT },
    fiscalData: { type: DataTypes.TEXT },
});

module.exports = Logistics;
