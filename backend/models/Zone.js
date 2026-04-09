const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Zone = sequelize.define('Zone', {
    name: { type: DataTypes.STRING, allowNull: false },
});

module.exports = Zone;
