const { Sequelize } = require('sequelize');
require('dotenv').config();

// Permite usar PostgreSQL o SQLite como fallback.
const dialect = process.env.DB_DIALECT || 'sqlite';

let sequelize;

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

module.exports = sequelize;
