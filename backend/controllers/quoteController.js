const { Quote, Recipient, Company, Zone, User, WonQuote, WonQuotePackage, Package, OperationalExpense } = require('../models');

const getQuotes = async (req, res) => {
    try {
        const quotes = await Quote.findAll({
            include: [
                {
                    model: Recipient,
                    as: 'recipient',
                    include: [
                        { model: Company, as: 'company' },
                        { model: Zone, as: 'zone' }
                    ]
                },
                { model: User, as: 'sender', attributes: ['name'] }
            ],
            order: [['commitmentDate', 'ASC']]
        });
        res.json(quotes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createQuote = async (req, res) => {
    try {
        const data = { ...req.body };
        // Limpiar strings vacíos antes de insertar (MySQL no acepta '' en DATE/INTEGER)
        if (!data.sentAt) delete data.sentAt;
        if (!data.sentBy || data.sentBy === '') delete data.sentBy;
        if (!data.recipientId || data.recipientId === '') delete data.recipientId;
        if (!data.internalNotes) data.internalNotes = null;
        if (!data.folio) delete data.folio;

        const quote = await Quote.create(data);
        res.status(201).json(quote);
    } catch (error) {
        console.error('[createQuote] Error:', error.message);
        res.status(400).json({ message: error.message });
    }
};

const updateQuote = async (req, res) => {
    try {
        const quote = await Quote.findByPk(req.params.id);
        if (!quote) return res.status(404).json({ message: 'Cotización no encontrada' });

        const data = { ...req.body };
        // Sanitizar strings vacíos
        if (data.sentAt === '') delete data.sentAt;
        if (data.sentBy === '' || data.sentBy === null) delete data.sentBy;
        if (data.recipientId === '') delete data.recipientId;
        if (!data.internalNotes) data.internalNotes = null;

        // Lógica de Registro de Envío Automático
        if (data.status === 'Enviado' && quote.status !== 'Enviado') {
            if (!data.sentAt) data.sentAt = new Date();
            if (!data.sentBy) data.sentBy = req.user.id;
        }

        await quote.update(data);
        res.json(quote);
    } catch (error) {
        console.error('[updateQuote] Error:', error.message);
        res.status(400).json({ message: error.message });
    }
};

const deleteQuote = async (req, res) => {
    try {
        const quote = await Quote.findByPk(req.params.id);
        if (!quote) return res.status(404).json({ message: 'Cotización no encontrada' });
        await quote.destroy();
        res.json({ message: 'Cotización eliminada' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Marcar cotización como GANADA (solo Admin)
const markAsWon = async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Solo administradores pueden marcar cotizaciones como Ganadas' });
        }

        const quote = await Quote.findByPk(req.params.id);
        if (!quote) return res.status(404).json({ message: 'Cotización no encontrada' });

        if (quote.status !== 'Enviado') {
            return res.status(400).json({ message: 'Solo cotizaciones en estado Enviado pueden marcarse como Ganadas' });
        }

        const { category, purchaseOrder } = req.body;
        if (!category) return res.status(400).json({ message: 'La categoría es obligatoria' });

        // Verificar que no exista ya un WonQuote para esta cotización
        const existing = await WonQuote.findOne({ where: { quoteId: quote.id } });
        if (existing) {
            // Si ya existe, solo actualizar el estado sin duplicar
            await quote.update({ status: 'Ganado' });
            return res.json({ quote, wonQuote: existing });
        }

        // Crear entrada en WonQuote
        const wonQuote = await WonQuote.create({
            quoteId: quote.id,
            category,
            purchaseOrder: purchaseOrder || null,
            wonAt: new Date(),
            wonBy: req.user.id
        });

        // Actualizar estado de la cotización
        await quote.update({ status: 'Ganado' });

        res.json({ quote, wonQuote });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Marcar cotización como PERDIDA y moverla al histórico (solo Admin)
const markAsLost = async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Solo administradores pueden marcar cotizaciones como Perdidas' });
        }

        const quote = await Quote.findByPk(req.params.id);
        if (!quote) return res.status(404).json({ message: 'Cotización no encontrada' });

        if (quote.status !== 'Enviado') {
            return res.status(400).json({ message: 'Solo cotizaciones en estado Enviado pueden marcarse como Perdidas' });
        }

        const { lostReason } = req.body;

        await quote.update({
            status: 'Perdido',
            lostAt: new Date(),
            lostReason: lostReason || null
        });

        res.json(quote);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Recuperar cotización desde el histórico (solo Admin)
const recoverQuote = async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Solo administradores pueden recuperar cotizaciones' });
        }

        const quote = await Quote.findByPk(req.params.id);
        if (!quote) return res.status(404).json({ message: 'Cotización no encontrada' });

        if (quote.status !== 'Perdido') {
            return res.status(400).json({ message: 'Solo cotizaciones en estado Perdido pueden recuperarse' });
        }

        await quote.update({
            status: 'Enviado',
            lostAt: null,
            lostReason: null,
            recoveredAt: new Date(),
            recoveredBy: req.user.id
        });

        res.json(quote);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// ===== SERVICIOS GENERALES (WonQuotes) =====

// Obtener todas las cotizaciones ganadas con sus detalles
const getWonQuotes = async (req, res) => {
    try {
        const wonQuotes = await WonQuote.findAll({
            include: [
                {
                    model: Quote,
                    as: 'quote',
                    include: [
                        {
                            model: Recipient,
                            as: 'recipient',
                            include: [
                                { model: Company, as: 'company' },
                                { model: Zone, as: 'zone' }
                            ]
                        },
                        { model: User, as: 'sender', attributes: ['name'] }
                    ],
                    where: { status: 'Ganado' } // Solo traer las que sigan como Ganadas (excluir Cerradas)
                },
                { model: User, as: 'winner', attributes: ['name'] },
                {
                    model: Package,
                    as: 'linkedPackages',
                    through: { attributes: [] }
                },
                {
                    model: OperationalExpense,
                    as: 'operationalExpenses'
                }
            ],
            order: [['wonAt', 'DESC']]
        });
        res.json(wonQuotes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Actualizar cotización ganada (progreso, orden de compra, categoría)
const updateWonQuote = async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Solo administradores pueden modificar el avance' });
        }

        const wonQuote = await WonQuote.findByPk(req.params.id);
        if (!wonQuote) return res.status(404).json({ message: 'Servicio no encontrado' });

        // Validar rangos de progreso
        const progressFields = ['internalPurchasesProgress', 'commercialCloseProgress', 'technicalCloseProgress', 'executionProgress'];
        for (const field of progressFields) {
            if (req.body[field] !== undefined) {
                const val = parseInt(req.body[field]);
                if (isNaN(val) || val < 0 || val > 100) {
                    return res.status(400).json({ message: `El campo ${field} debe ser entre 0 y 100` });
                }
            }
        }

        await wonQuote.update(req.body);
        res.json(wonQuote);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Vincular compra (Package) a cotización ganada (solo Admin)
const linkPackage = async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Solo administradores pueden vincular compras' });
        }

        const { wonQuoteId } = req.params;
        const { packageId } = req.body;

        const wonQuote = await WonQuote.findByPk(wonQuoteId);
        if (!wonQuote) return res.status(404).json({ message: 'Cotización ganada no encontrada' });

        const pkg = await Package.findByPk(packageId);
        if (!pkg) return res.status(404).json({ message: 'Compra no encontrada' });

        // Verificar si ya está vinculada
        const existing = await WonQuotePackage.findOne({ where: { wonQuoteId, packageId } });
        if (existing) {
            return res.status(400).json({ message: 'Esta compra ya está vinculada a la cotización' });
        }

        await WonQuotePackage.create({ wonQuoteId, packageId });

        res.json({ message: 'Compra vinculada exitosamente' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Desvincular compra de cotización ganada (solo Admin)
const unlinkPackage = async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Solo administradores pueden desvincular compras' });
        }

        const { wonQuoteId, packageId } = req.params;

        const link = await WonQuotePackage.findOne({ where: { wonQuoteId, packageId } });
        if (!link) return res.status(404).json({ message: 'Vínculo no encontrado' });

        await link.destroy();
        res.json({ message: 'Compra desvinculada exitosamente' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ====== NUEVAS FUNCIONALIDADES ======

// Obtener histórico de cotizaciones (Perdidas y Cerradas)
const getQuoteHistory = async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Solo administradores pueden ver histórico' });
        }
        const { Op } = require('sequelize');
        const history = await Quote.findAll({
            where: { status: { [Op.in]: ['Perdido', 'Cerrado'] } },
            include: [
                {
                    model: Recipient,
                    as: 'recipient',
                    include: [{ model: Company, as: 'company' }]
                },
                {
                    model: WonQuote,
                    as: 'wonQuote',
                    include: [
                        { model: Package, as: 'linkedPackages', through: { attributes: [] } },
                        { model: OperationalExpense, as: 'operationalExpenses' }
                    ]
                }
            ],
            order: [['updatedAt', 'DESC']]
        });
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Cerrar Proyecto (Cotización Ganada a Cerrada)
const closeQuote = async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Solo administradores pueden cerrar proyectos' });
        }
        const wonQuote = await WonQuote.findByPk(req.params.id, { include: ['quote'] });
        if (!wonQuote || !wonQuote.quote) return res.status(404).json({ message: 'Proyecto no encontrado' });

        await wonQuote.quote.update({ status: 'Cerrado' });
        res.json({ message: 'Cotización cerrada exitosamente y enviada al histórico' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Obtener todos los gastos operativos
const getOperationalExpenses = async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Solo administradores pueden ver gastos' });
        }
        const expenses = await OperationalExpense.findAll({
            include: [{
                model: WonQuote,
                as: 'wonQuote',
                include: [{ model: Quote, as: 'quote', attributes: ['folio', 'description'] }]
            }],
            order: [['date', 'DESC']]
        });
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Agregar un Gasto Operativo a un proyecto
const addOperationalExpense = async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Solo administradores pueden registrar gastos' });
        }
        const { wonQuoteId, description, amount, date } = req.body;
        if (!wonQuoteId || !description || amount === undefined) {
            return res.status(400).json({ message: 'Faltan campos obligatorios' });
        }

        const expense = await OperationalExpense.create({
            wonQuoteId, description, amount, date: date || new Date()
        });
        res.status(201).json(expense);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Eliminar un Gasto Operativo
const deleteOperationalExpense = async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Solo administradores pueden eliminar gastos' });
        }
        const expense = await OperationalExpense.findByPk(req.params.id);
        if (!expense) return res.status(404).json({ message: 'Gasto no encontrado' });

        await expense.destroy();
        res.json({ message: 'Gasto eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { 
    getQuotes, createQuote, updateQuote, deleteQuote,
    markAsWon, markAsLost, recoverQuote,
    getWonQuotes, updateWonQuote, linkPackage, unlinkPackage,
    closeQuote, addOperationalExpense, deleteOperationalExpense, getOperationalExpenses, getQuoteHistory
};
