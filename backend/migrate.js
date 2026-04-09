/**
 * Migration Script: Actualizar tabla Quotes con nuevos campos y estados.
 * Ejecutar UNA SOLA VEZ: node migrate.js
 */
require('dotenv').config();
const { sequelize } = require('./models');

async function migrate() {
    try {
        const queryInterface = sequelize.getQueryInterface();
        const dialect = sequelize.getDialect();
        
        console.log(`[migrate] Iniciando migración (dialect: ${dialect})...`);
        
        // 1. Modificar el ENUM del campo 'status' en la tabla Quotes para incluir Ganado y Perdido
        if (dialect === 'mysql') {
            await sequelize.query(`
                ALTER TABLE Quotes 
                MODIFY COLUMN status ENUM('Pendiente', 'Enviado', 'Ganado', 'Perdido') 
                NOT NULL DEFAULT 'Pendiente';
            `);
            console.log('[migrate] ✅ ENUM de status actualizado (Ganado, Perdido)');
        }
        
        // 2. Agregar columna lostAt
        try {
            await queryInterface.addColumn('Quotes', 'lostAt', {
                type: require('sequelize').DataTypes.DATE,
                allowNull: true
            });
            console.log('[migrate] ✅ Columna lostAt agregada');
        } catch (e) {
            if (e.message.includes('Duplicate column')) console.log('[migrate] ⚠️  lostAt ya existe, omitiendo');
            else throw e;
        }
        
        // 3. Agregar columna lostReason
        try {
            await queryInterface.addColumn('Quotes', 'lostReason', {
                type: require('sequelize').DataTypes.TEXT,
                allowNull: true
            });
            console.log('[migrate] ✅ Columna lostReason agregada');
        } catch (e) {
            if (e.message.includes('Duplicate column')) console.log('[migrate] ⚠️  lostReason ya existe, omitiendo');
            else throw e;
        }
        
        // 4. Agregar columna recoveredAt
        try {
            await queryInterface.addColumn('Quotes', 'recoveredAt', {
                type: require('sequelize').DataTypes.DATE,
                allowNull: true
            });
            console.log('[migrate] ✅ Columna recoveredAt agregada');
        } catch (e) {
            if (e.message.includes('Duplicate column')) console.log('[migrate] ⚠️  recoveredAt ya existe, omitiendo');
            else throw e;
        }
        
        // 5. Agregar columna recoveredBy
        try {
            await queryInterface.addColumn('Quotes', 'recoveredBy', {
                type: require('sequelize').DataTypes.INTEGER,
                allowNull: true
            });
            console.log('[migrate] ✅ Columna recoveredBy agregada');
        } catch (e) {
            if (e.message.includes('Duplicate column')) console.log('[migrate] ⚠️  recoveredBy ya existe, omitiendo');
            else throw e;
        }
        
        // 6. Crear tabla WonQuotes si no existe (sync lo hará, pero asegurar)
        await sequelize.sync({ force: false });
        console.log('[migrate] ✅ Nuevas tablas creadas (WonQuotes, WonQuotePackages)');
        
        console.log('\n✅✅✅ Migración completada exitosamente.\n');
        process.exit(0);
    } catch (error) {
        console.error('[migrate] ❌ Error durante migración:', error.message);
        process.exit(1);
    }
}

migrate();
