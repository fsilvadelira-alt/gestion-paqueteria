const sequelize = require('../config/db');

const User = require('./User');
const Carrier = require('./Carrier');
const Recipient = require('./Recipient');
const Package = require('./Package');
const Expense = require('./Expense');
const Logistics = require('./Logistics');
const Company = require('./Company');
const Zone = require('./Zone');
const Quote = require('./Quote');
const WonQuote = require('./WonQuote');
const WonQuotePackage = require('./WonQuotePackage');
const OperationalExpense = require('./OperationalExpense');

// Assosiations
User.hasMany(Package, { foreignKey: 'receivedBy', as: 'receivedPackages' });
Package.belongsTo(User, { foreignKey: 'receivedBy', as: 'receiver' });

User.hasMany(Package, { foreignKey: 'deliveredBy', as: 'deliveredPackages' });
Package.belongsTo(User, { foreignKey: 'deliveredBy', as: 'deliverer' });

Carrier.hasMany(Package, { foreignKey: 'carrierId', as: 'packages' });
Package.belongsTo(Carrier, { foreignKey: 'carrierId', as: 'carrier' });

Recipient.hasMany(Package, { foreignKey: 'recipientId', as: 'packages' });
Package.belongsTo(Recipient, { foreignKey: 'recipientId', as: 'finalRecipient' });

Logistics.hasMany(Package, { foreignKey: 'logisticsCompanyId', as: 'packages' });
Package.belongsTo(Logistics, { foreignKey: 'logisticsCompanyId', as: 'logisticsCompany' });

User.hasMany(Expense, { foreignKey: 'userId', as: 'expenses' });
Expense.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Relación para saber quién asignó o editó el gasto de paquetería
User.hasMany(Package, { foreignKey: 'shippingAdminId', as: 'shippingPackages' });
Package.belongsTo(User, { foreignKey: 'shippingAdminId', as: 'shippingAdmin' });

Company.hasMany(Zone, { foreignKey: 'companyId', as: 'zones' });
Zone.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

Company.hasMany(Recipient, { foreignKey: 'companyId', as: 'recipients' });
Recipient.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

Zone.hasMany(Recipient, { foreignKey: 'zoneId', as: 'recipients' });
Recipient.belongsTo(Zone, { foreignKey: 'zoneId', as: 'zone' });

Recipient.hasMany(Quote, { foreignKey: 'recipientId', as: 'quotes' });
Quote.belongsTo(Recipient, { foreignKey: 'recipientId', as: 'recipient' });

User.hasMany(Quote, { foreignKey: 'sentBy', as: 'sentQuotes' });
Quote.belongsTo(User, { foreignKey: 'sentBy', as: 'sender' });

// Relaciones WonQuote
Quote.hasOne(WonQuote, { foreignKey: 'quoteId', as: 'wonQuote' });
WonQuote.belongsTo(Quote, { foreignKey: 'quoteId', as: 'quote' });

User.hasMany(WonQuote, { foreignKey: 'wonBy', as: 'wonQuotes' });
WonQuote.belongsTo(User, { foreignKey: 'wonBy', as: 'winner' });

// Relaciones WonQuote - Package (Compras) muchos a muchos via tabla pivot
WonQuote.belongsToMany(Package, { through: WonQuotePackage, foreignKey: 'wonQuoteId', as: 'linkedPackages' });
Package.belongsToMany(WonQuote, { through: WonQuotePackage, foreignKey: 'packageId', as: 'wonQuotes' });

// Relación WonQuote - OperationalExpense (1 a N)
WonQuote.hasMany(OperationalExpense, { foreignKey: 'wonQuoteId', as: 'operationalExpenses' });
OperationalExpense.belongsTo(WonQuote, { foreignKey: 'wonQuoteId', as: 'wonQuote' });

module.exports = {
    sequelize,
    User,
    Carrier,
    Recipient,
    Package,
    Expense,
    Logistics,
    Company,
    Zone,
    Quote,
    WonQuote,
    WonQuotePackage,
    OperationalExpense
};
