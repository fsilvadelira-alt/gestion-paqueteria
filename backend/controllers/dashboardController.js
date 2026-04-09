const { Package, Expense, Carrier, Logistics } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/db');

const getDashboardStats = async (req, res) => {
    try {
        const date = new Date();
        const currentYear = date.getFullYear();
        const currentMonthStr = String(date.getMonth() + 1).padStart(2, '0');
        const nextMonthStr = String(date.getMonth() + 2).padStart(2, '0');

        const firstDay = `${currentYear}-${currentMonthStr}-01`;
        const lastDay = date.getMonth() === 11
            ? `${currentYear + 1}-01-01`
            : `${currentYear}-${nextMonthStr}-01`; // exclusive upper bound

        const totalEnCamino = await Package.count({ where: { status: 'En camino' } });
        const totalRecibidos = await Package.count({ where: { status: 'Recibido' } });
        const totalEntregados = await Package.count({ where: { status: 'Entregado' } });
        const totalParaRegresar = await Package.count({ 
            where: { status: { [Op.in]: ['Incorrecto', 'Defectuoso'] } } 
        });

        const gastosMensualesAmount = await Package.sum('amountMXN', {
            where: {
                registrationDate: {
                    [Op.between]: [firstDay, lastDay],
                }
            }
        });
        const gastosMensualesShipping = await Package.sum('shippingCost', {
            where: {
                registrationDate: {
                    [Op.between]: [firstDay, lastDay],
                }
            }
        });
        const gastosMensualesCajaChica = await Expense.sum('amount', {
            where: {
                type: 'gasto',
                date: {
                    [Op.between]: [firstDay, lastDay],
                }
            }
        });
        const gastosMensuales = (gastosMensualesAmount || 0) + (gastosMensualesShipping || 0) + (gastosMensualesCajaChica || 0);

        const gastosTotalesCajaChica = await Expense.sum('amount', { where: { type: 'gasto' } });
        const ingresosTotalesCajaChica = await Expense.sum('amount', { where: { type: 'ingreso' } });
        const saldoCajaChica = (ingresosTotalesCajaChica || 0) - (gastosTotalesCajaChica || 0);

        const gastosTotales = ((await Package.sum('amountMXN')) || 0) + ((await Package.sum('shippingCost')) || 0) + (gastosTotalesCajaChica || 0);

        const gastosFacturadosCajaChica = await Expense.sum('amount', { where: { type: 'gasto', isFacturado: true } });
        const gastosNoFacturadosCajaChica = await Expense.sum('amount', { where: { type: 'gasto', isFacturado: false } });

        const gastosFacturados = ((await Package.sum('amountMXN', { where: { isBilled: true } })) || 0) + 
                                 ((await Package.sum('shippingCost', { where: { shippingIsBilled: true } })) || 0) + (gastosFacturadosCajaChica || 0);
        const gastosNoFacturados = ((await Package.sum('amountMXN', { where: { isBilled: false } })) || 0) + 
                                   ((await Package.sum('shippingCost', { where: { shippingIsBilled: false } })) || 0) + (gastosNoFacturadosCajaChica || 0);

        res.json({
            totalEnCamino,
            totalRecibidos,
            totalEntregados,
            totalParaRegresar,
            gastosMensuales: gastosMensuales || 0,
            gastosTotales: gastosTotales || 0,
            gastosFacturados: gastosFacturados || 0,
            gastosNoFacturados: gastosNoFacturados || 0,
            saldoCajaChica: saldoCajaChica || 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getChartData = async (req, res) => {
    try {
        const expensesByCarrier = await Package.findAll({
            attributes: [
                'carrierId',
                [sequelize.fn('SUM', sequelize.col('amountMXN')), 'totalCost']
            ],
            include: [{ model: Carrier, as: 'carrier', attributes: ['name'] }],
            group: ['carrierId', 'carrier.id']
        });

        const packagesByCarrier = await Package.findAll({
            attributes: [
                'carrierId',
                [sequelize.fn('COUNT', sequelize.col('Package.id')), 'totalPackages']
            ],
            include: [{ model: Carrier, as: 'carrier', attributes: ['name'] }],
            where: {
                purchaseType: { [Op.ne]: 'Gasto de Paquetería' }
            },
            group: ['carrierId', 'carrier.id']
        });

        const packagesByLogistics = await Package.findAll({
            attributes: [
                'logisticsCompanyId',
                [sequelize.fn('COUNT', sequelize.col('Package.id')), 'totalPackages']
            ],
            include: [{ model: Logistics, as: 'logisticsCompany', attributes: ['name'] }],
            where: {
                logisticsCompanyId: { [Op.not]: null }
            },
            group: ['logisticsCompanyId', 'logisticsCompany.id']
        });

        const packagesByStatus = await Package.findAll({
            attributes: [
                'status',
                [sequelize.fn('COUNT', sequelize.col('Package.id')), 'totalPackages']
            ],
            group: ['status']
        });

        const currentYear = new Date().getFullYear();
        const monthlyTrend = await sequelize.query(`
            SELECT month, SUM(totalCost) as totalCost 
            FROM (
                SELECT substr(registrationDate, 6, 2) as month, (amountMXN + IFNULL(shippingCost, 0)) as totalCost 
                FROM Packages 
                WHERE substr(registrationDate, 1, 4) = '${currentYear}' 
                
                UNION ALL
                
                SELECT substr(date, 6, 2) as month, amount as totalCost
                FROM Expenses
                WHERE substr(date, 1, 4) = '${currentYear}' AND type = 'gasto'
            ) AS combined_trends
            GROUP BY month 
            ORDER BY month ASC
        `, { type: sequelize.QueryTypes.SELECT });

        res.json({
            expensesByCarrier,
            packagesByCarrier,
            packagesByStatus,
            packagesByLogistics,
            monthlyTrend
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getDashboardStats, getChartData };
