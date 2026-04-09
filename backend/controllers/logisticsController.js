const { Logistics } = require('../models');

const getLogistics = async (req, res) => {
    try {
        const logistics = await Logistics.findAll();
        res.json(logistics);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createLogistics = async (req, res) => {
    try {
        const logistics = await Logistics.create(req.body);
        res.status(201).json(logistics);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateLogistics = async (req, res) => {
    try {
        const logistics = await Logistics.findByPk(req.params.id);
        if (!logistics) return res.status(404).json({ message: 'Logistics not found' });

        await logistics.update(req.body);
        res.json(logistics);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteLogistics = async (req, res) => {
    try {
        const logistics = await Logistics.findByPk(req.params.id);
        if (!logistics) return res.status(404).json({ message: 'Logistics not found' });

        await logistics.destroy();
        res.json({ message: 'Logistics deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getLogistics, createLogistics, updateLogistics, deleteLogistics };
