const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Recipient = sequelize.define('Recipient', {
    name: { type: DataTypes.STRING, allowNull: false },
    department: { type: DataTypes.STRING },
    phone: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING },
    notes: { type: DataTypes.TEXT },
});

module.exports = Recipient;
