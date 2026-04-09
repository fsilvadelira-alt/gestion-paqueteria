const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

// Railway provee DATABASE_URL automáticamente al conectar una BD PostgreSQL.
// Si existe, la usamos directamente. Sino, usamos las variables individuales del .env.
if (process.env.DATABASE_URL) {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        protocol: 'postgres',
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false,
            },
        },
    });
} else {
    const dialect = process.env.DB_DIALECT || 'sqlite';

    if (dialect === 'postgres') {
        sequelize = new Sequelize(
            process.env.DB_NAME,
            process.env.DB_USER,
            process.env.DB_PASSWORD,
            {
                host: process.env.DB_HOST,
                dialect: 'postgres',
                logging: false,
            }
        );
    } else if (dialect === 'mysql') {
        sequelize = new Sequelize(
            process.env.DB_NAME,
            process.env.DB_USER,
            process.env.DB_PASSWORD,
            {
                host: process.env.DB_HOST,
                port: process.env.DB_PORT || 3306,
                dialect: 'mysql',
                logging: false,
            }
        );
    } else {
        sequelize = new Sequelize({
            dialect: 'sqlite',
            storage: './database.sqlite',
            logging: false,
        });
    }
}

module.exports = sequelize;
