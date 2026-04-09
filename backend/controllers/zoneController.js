const { Zone } = require('../models');

const getZones = async (req, res) => {
    try {
        const zones = await Zone.findAll({ order: [['name', 'ASC']] });
        res.json(zones);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createZone = async (req, res) => {
    try {
        const zone = await Zone.create(req.body);
        res.status(201).json(zone);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateZone = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ message: 'El nombre es obligatorio' });

        const zone = await Zone.findByPk(req.params.id);
        if (!zone) return res.status(404).json({ message: 'Zona no encontrada' });

        // Check for duplicates within the same company
        const existing = await Zone.findOne({ where: { name: name.trim(), companyId: zone.companyId } });
        if (existing && existing.id !== parseInt(req.params.id)) {
            return res.status(400).json({ message: 'Ya existe un departamento con ese nombre en esta empresa' });
        }

        await zone.update({ name: name.trim() });
        res.json(zone);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteZone = async (req, res) => {
    try {
        const zone = await Zone.findByPk(req.params.id);
        if (!zone) return res.status(404).json({ message: 'Zona no encontrada' });
        await zone.destroy();
        res.json({ message: 'Zona eliminada' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getZones, createZone, updateZone, deleteZone };
