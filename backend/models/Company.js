const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Company = sequelize.define('Company', {
    name: { type: DataTypes.STRING, allowNull: false },
});

module.exports = Company;
