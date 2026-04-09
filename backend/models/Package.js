const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Package = sequelize.define('Package', {
    // Nuevos campos de Compra
    requisitionDate: { type: DataTypes.DATE },
    purchaseType: { type: DataTypes.STRING },
    description: { type: DataTypes.TEXT },
    amountMXN: { type: DataTypes.FLOAT, defaultValue: 0 },
    arrivalDate: { type: DataTypes.DATE },
    paymentMethod: { type: DataTypes.ENUM('Tarjeta de crédito', 'Efectivo', 'Transferencia') },
    isBilled: { type: DataTypes.BOOLEAN, defaultValue: false },

    // Fotos de unboxing y entrega
    unboxingPhoto: { type: DataTypes.TEXT('long') },
    deliveryPhoto: { type: DataTypes.TEXT('long') },
    deliveryNotes: { type: DataTypes.TEXT },

    // Campos anteriores que mantenemos o reutilizamos
    registrationDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    receptionDate: { type: DataTypes.DATE },
    trackingNumber: { type: DataTypes.STRING, allowNull: true },
    shippingCost: { type: DataTypes.FLOAT, defaultValue: 0 },
    shippingIsBilled: { type: DataTypes.BOOLEAN, defaultValue: false },
    shippingCostAssigned: { type: DataTypes.BOOLEAN, defaultValue: false },
    shippingNotes: { type: DataTypes.TEXT },
    shippingAssignedAt: { type: DataTypes.DATE },
    observations: { type: DataTypes.TEXT },
    personReceiving: { type: DataTypes.STRING },
    
    // Estados actualizados con el flujo nuevo
    status: {
        type: DataTypes.ENUM(
            'En camino', 
            'Recibido', 
            'Listo para entregar', 
            'Incorrecto', 
            'Defectuoso', 
            'Entregado'
        ),
        defaultValue: 'En camino'
    },
    deliveryDate: { type: DataTypes.DATE },
    scheduledForPayment: { type: DataTypes.BOOLEAN, defaultValue: false },
});

module.exports = Package;
