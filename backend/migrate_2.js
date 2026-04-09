require('dotenv').config();
const { sequelize } = require('./models');

async function migrate_2() {
    try {
        const queryInterface = sequelize.getQueryInterface();
        const dialect = sequelize.getDialect();
        
        console.log(`[migrate_2] Iniciando migración parte 2 (dialect: ${dialect})...`);
        
        // 1. Modificar el ENUM del campo 'status' en la tabla Quotes para incluir Cerrado
        if (dialect === 'mysql') {
            await sequelize.query(`
                ALTER TABLE Quotes 
                MODIFY COLUMN status ENUM('Pendiente', 'Enviado', 'Ganado', 'Perdido', 'Cerrado') 
                NOT NULL DEFAULT 'Pendiente';
            `);
            console.log('[migrate_2] ✅ ENUM de status actualizado (incluye Cerrado)');
        }
        
        // 2. Agregar columna cost
        try {
            await queryInterface.addColumn('Quotes', 'cost', {
                type: require('sequelize').DataTypes.FLOAT,
                allowNull: false,
                defaultValue: 0
            });
            console.log('[migrate_2] ✅ Columna cost agregada a Quotes');
        } catch (e) {
            if (e.message.includes('Duplicate column')) console.log('[migrate_2] ⚠️  cost ya existe, omitiendo');
            else throw e;
        }
        
        // 3. Crear tabla OperationalExpenses si no existe
        await sequelize.sync({ force: false });
        console.log('[migrate_2] ✅ Nuevas tablas creadas/sincronizadas (OperationalExpenses)');
        
        console.log('\n✅✅✅ Migración 2 completada exitosamente.\n');
        process.exit(0);
    } catch (error) {
        console.error('[migrate_2] ❌ Error durante migración:', error.message);
        process.exit(1);
    }
}

migrate_2();
