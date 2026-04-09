const { Carrier } = require('../models');

const getCarriers = async (req, res) => {
    try {
        const carriers = await Carrier.findAll();
        res.json(carriers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createCarrier = async (req, res) => {
    try {
        const carrier = await Carrier.create(req.body);
        res.status(201).json(carrier);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateCarrier = async (req, res) => {
    try {
        const carrier = await Carrier.findByPk(req.params.id);
        if (!carrier) return res.status(404).json({ message: 'Paquetería no encontrada' });
        await carrier.update(req.body);
        res.json(carrier);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteCarrier = async (req, res) => {
    try {
        const carrier = await Carrier.findByPk(req.params.id);
        if (!carrier) return res.status(404).json({ message: 'Paquetería no encontrada' });
        await carrier.destroy();
        res.json({ message: 'Paquetería eliminada' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getCarriers, createCarrier, updateCarrier, deleteCarrier };
