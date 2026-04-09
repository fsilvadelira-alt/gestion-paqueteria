const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Quote = sequelize.define('Quote', {
    requestDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    commitmentDate: { type: DataTypes.DATE, allowNull: false },
    description: { type: DataTypes.TEXT },
    status: { 
        type: DataTypes.ENUM('Pendiente', 'Enviado', 'Ganado', 'Perdido', 'Cerrado'), 
        defaultValue: 'Pendiente' 
    },
    folio: { type: DataTypes.STRING, allowNull: true },
    cost: { type: DataTypes.FLOAT, defaultValue: 0 },
    
    // Seguimiento de llamadas
    call1: { type: DataTypes.BOOLEAN, defaultValue: false },
    call2: { type: DataTypes.BOOLEAN, defaultValue: false },
    call3: { type: DataTypes.BOOLEAN, defaultValue: false },
    
    // Datos de despacho
    sentAt: { type: DataTypes.DATE },
    sentBy: { type: DataTypes.INTEGER },
    
    // Notas adicionales
    internalNotes: { type: DataTypes.TEXT },
    
    // Histórico: fecha y motivo de pérdida
    lostAt: { type: DataTypes.DATE, allowNull: true },
    lostReason: { type: DataTypes.TEXT, allowNull: true },
    
    // Recuperación desde histórico
    recoveredAt: { type: DataTypes.DATE, allowNull: true },
    recoveredBy: { type: DataTypes.INTEGER, allowNull: true }
});

module.exports = Quote;
