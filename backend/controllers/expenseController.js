const { Expense, User } = require('../models');

const getExpenses = async (req, res) => {
    try {
        const expenses = await Expense.findAll({
            include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
            order: [['date', 'DESC']]
        });
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createExpense = async (req, res) => {
    try {
        const expense = await Expense.create({
            ...req.body,
            userId: req.user.id
        });
        res.status(201).json(expense);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateExpense = async (req, res) => {
    try {
        const expense = await Expense.findByPk(req.params.id);
        if (!expense) return res.status(404).json({ message: 'Gasto no encontrado' });
        await expense.update(req.body);
        res.json(expense);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findByPk(req.params.id);
        if (!expense) return res.status(404).json({ message: 'Gasto no encontrado' });
        await expense.destroy();
        res.json({ message: 'Gasto eliminado' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getExpenses, createExpense, updateExpense, deleteExpense };
