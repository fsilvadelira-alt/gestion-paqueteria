const { Company } = require('../models');

const getCompanies = async (req, res) => {
    try {
        const companies = await Company.findAll({ order: [['name', 'ASC']] });
        res.json(companies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createCompany = async (req, res) => {
    try {
        const company = await Company.create(req.body);
        res.status(201).json(company);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateCompany = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ message: 'El nombre es obligatorio' });

        const company = await Company.findByPk(req.params.id);
        if (!company) return res.status(404).json({ message: 'Empresa no encontrada' });

        // Check for duplicates
        const existing = await Company.findOne({ where: { name: name.trim() } });
        if (existing && existing.id !== parseInt(req.params.id)) {
            return res.status(400).json({ message: 'Ya existe una empresa con ese nombre' });
        }

        await company.update({ name: name.trim() });
        res.json(company);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteCompany = async (req, res) => {
    try {
        const company = await Company.findByPk(req.params.id);
        if (!company) return res.status(404).json({ message: 'Empresa no encontrada' });
        await company.destroy();
        res.json({ message: 'Empresa eliminada' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getCompanies, createCompany, updateCompany, deleteCompany };
