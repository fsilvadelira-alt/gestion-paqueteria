const { Package, Carrier, Recipient, User, Logistics } = require('../models');
const { Op } = require('sequelize');

const getPackages = async (req, res) => {
    try {
        const packages = await Package.findAll({
            include: [
                { model: Carrier, as: 'carrier' },
                { model: Logistics, as: 'logisticsCompany' },
                { model: Recipient, as: 'finalRecipient' },
                { model: User, as: 'receiver', attributes: ['id', 'name'] },
                { model: User, as: 'deliverer', attributes: ['id', 'name'] },
                { model: User, as: 'shippingAdmin', attributes: ['id', 'name'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(packages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createPackage = async (req, res) => {
    try {
        const newPackage = await Package.create({
            ...req.body,
            receivedBy: req.user.id
        });
        res.status(201).json(newPackage);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updatePackage = async (req, res) => {
    try {
        const pkg = await Package.findByPk(req.params.id);
        if (!pkg) return res.status(404).json({ message: 'Compra no encontrada' });

        const unboxingStates = ['Listo para entregar', 'Incorrecto', 'Defectuoso'];
        if (req.body.status && unboxingStates.includes(req.body.status) && !unboxingStates.includes(pkg.status)) {
            if (req.user.role !== 'Admin') {
                return res.status(403).json({ message: 'Solo los administradores pueden hacer el unboxing' });
            }
        }

        if (req.body.status === 'Recibido' && pkg.status !== 'Recibido') {
            req.body.receptionDate = new Date();
            req.body.receivedBy = req.user.id;
        }

        if (req.body.status === 'Entregado' && pkg.status !== 'Entregado') {
            req.body.deliveryDate = new Date();
            req.body.deliveredBy = req.user.id;
        }

        if (req.body.shippingCostAssigned) {
            req.body.shippingAssignedAt = new Date();
            req.body.shippingAdminId = req.user.id;
        }

        await pkg.update(req.body);
        res.json(pkg);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deletePackage = async (req, res) => {
    try {
        const pkg = await Package.findByPk(req.params.id);
        if (!pkg) return res.status(404).json({ message: 'Paquete no encontrado' });
        await pkg.destroy();
        res.json({ message: 'Paquete eliminado' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const searchPackageByTracking = async (req, res) => {
    try {
        const { tracking } = req.params;
        const pkg = await Package.findOne({
            where: { trackingNumber: tracking },
            include: [
                { model: Carrier, as: 'carrier' },
                { model: Logistics, as: 'logisticsCompany' },
                { model: Recipient, as: 'finalRecipient' }
            ]
        });
        if (!pkg) return res.status(404).json({ message: 'Paquete no encontrado' });
        res.json(pkg);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getPackages, createPackage, updatePackage, deletePackage, searchPackageByTracking };
