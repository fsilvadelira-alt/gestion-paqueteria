const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Modelo para cotizaciones ganadas (Servicios Generales)
const WonQuote = sequelize.define('WonQuote', {
    quoteId: { 
        type: DataTypes.INTEGER, 
        allowNull: false, 
        unique: true // Una cotización solo puede ser ganada una vez
    },
    purchaseOrder: { type: DataTypes.STRING, allowNull: true }, // Orden de compra
    category: { 
        type: DataTypes.ENUM('Reventa', 'Subcontratacion', 'Servicios'), 
        allowNull: false 
    },
    
    // Control: Compras Internas (aplica a todas las categorías)
    internalPurchasesProgress: { type: DataTypes.INTEGER, defaultValue: 0 }, // 0-100
    
    // Control: Cierre Comercial (aplica a Reventa, Subcontratación, Servicios)
    commercialCloseProgress: { type: DataTypes.INTEGER, defaultValue: 0 }, // 0-100
    
    // Control: Cierre Técnico (aplica a Subcontratación y Servicios)
    technicalCloseProgress: { type: DataTypes.INTEGER, defaultValue: 0 }, // 0-100
    
    // Control: Ejecución (solo Servicios)
    executionProgress: { type: DataTypes.INTEGER, defaultValue: 0 }, // 0-100
    
    // Metadatos
    wonAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    wonBy: { type: DataTypes.INTEGER, allowNull: true }
});

module.exports = WonQuote;
