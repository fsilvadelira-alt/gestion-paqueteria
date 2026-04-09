const express = require('express');
const router = express.Router();
const { loginUser, registerUser, getUsers, updateUser, deleteUser } = require('../controllers/authController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

router.post('/login', loginUser);
router.post('/register', protect, adminOnly, registerUser); // Solo admins pueden crear usuarios según requerimiento o podemos dejarlo abierto al inicio. Dejémoslo abierto en el primer boot.
router.post('/setup', registerUser); // Ruta para crear el primer admin sin token
router.get('/', protect, adminOnly, getUsers);
router.put('/:id', protect, adminOnly, updateUser);
router.delete('/:id', protect, adminOnly, deleteUser);

module.exports = router;
