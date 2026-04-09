const { Recipient, Company, Zone } = require('../models');

const getRecipients = async (req, res) => {
    try {
        const recipients = await Recipient.findAll({
            include: [
                { model: Company, as: 'company' },
                { model: Zone, as: 'zone' }
            ],
            order: [['name', 'ASC']]
        });
        res.json(recipients);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createRecipient = async (req, res) => {
    try {
        const recipient = await Recipient.create(req.body);
        res.status(201).json(recipient);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateRecipient = async (req, res) => {
    try {
        const recipient = await Recipient.findByPk(req.params.id);
        if (!recipient) return res.status(404).json({ message: 'Destinatario no encontrado' });
        await recipient.update(req.body);
        res.json(recipient);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteRecipient = async (req, res) => {
    try {
        const recipient = await Recipient.findByPk(req.params.id);
        if (!recipient) return res.status(404).json({ message: 'Destinatario no encontrado' });
        await recipient.destroy();
        res.json({ message: 'Destinatario eliminado' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getRecipients, createRecipient, updateRecipient, deleteRecipient };
