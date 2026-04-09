const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Tabla pivot para vincular compras (Package) a cotizaciones ganadas (WonQuote)
const WonQuotePackage = sequelize.define('WonQuotePackage', {
    wonQuoteId: { type: DataTypes.INTEGER, allowNull: false },
    packageId: { type: DataTypes.INTEGER, allowNull: false }
}, {
    indexes: [
        {
            unique: true,
            fields: ['wonQuoteId', 'packageId'] // Evitar duplicados
        }
    ]
});

module.exports = WonQuotePackage;
