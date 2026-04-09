import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit, Trash2 } from 'lucide-react';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'User'
    });
    const [editId, setEditId] = useState(null);

    const fetchUsers = async () => {
        try {
            const { data } = await api.get('/auth');
            setUsers(data);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editId) {
                // Remove password from payload if it's empty during edit
                const payload = { ...formData };
                if (!payload.password) delete payload.password;

                await api.put(`/auth/${editId}`, payload);
            } else {
                await api.post('/auth/register', formData);
            }
            setShowModal(false);
            fetchUsers();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Error guardando usuario');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este usuario?')) {
            try {
                await api.delete(`/auth/${id}`);
                fetchUsers();
            } catch (error) {
                console.error(error);
                alert('Error eliminando usuario');
            }
        }
    };

    const openEdit = (user) => {
        setEditId(user.id);
        setFormData({
            name: user.name,
            email: user.email,
            password: '', // Password is never loaded
            role: user.role
        });
        setShowModal(true);
    };

    const openNew = () => {
        setEditId(null);
        setFormData({
            name: '',
            email: '',
            password: '',
            role: 'User'
        });
        setShowModal(true);
    };

    return (
        <div>
            <div className="title-row">
                <h2>Gestión de Usuarios</h2>
                <button className="btn btn-primary" onClick={openNew}>
                    <Plus size={18} /> Nuevo Usuario
                </button>
            </div>

            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Email</th>
                                <th>Rol</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id}>
                                    <td>{u.name}</td>
                                    <td>{u.email}</td>
                                    <td>
                                        <span className={`status-badge ${u.role === 'Admin' ? 'status-entregado' : 'status-recibido'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="btn" style={{ padding: '5px', color: 'var(--warning)', background: 'transparent' }} onClick={() => openEdit(u)}>
                                            <Edit size={18} />
                                        </button>
                                        <button className="btn" style={{ padding: '5px', color: 'var(--error)', background: 'transparent' }} onClick={() => handleDelete(u.id)}>
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No hay usuarios registrados</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{editId ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>Cerrar</button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>Nombre Completo</label>
                                    <input required className="form-control" type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Correo Electrónico (Email)</label>
                                    <input required className="form-control" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Rol</label>
                                    <select className="form-control" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                        <option value="User">Usuario Normal</option>
                                        <option value="Admin">Administrador</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Contraseña {editId && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>(Opcional, dejar en blanco para no cambiar)</span>}</label>
                                    <input required={!editId} className="form-control" type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                                    Guardar Usuario
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
