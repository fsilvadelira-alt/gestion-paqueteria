import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit, Trash2 } from 'lucide-react';

const Logistics = () => {
    const [data, setData] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '', fiscalData: '', website: '', notes: '' });
    const [editId, setEditId] = useState(null);

    const fetchData = async () => {
        const res = await api.get('/logistics');
        setData(res.data);
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (editId) await api.put(`/logistics/${editId}`, formData);
        else await api.post('/logistics', formData);
        setShowModal(false);
        fetchData();
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Eliminar paquetería?')) {
            await api.delete(`/logistics/${id}`);
            fetchData();
        }
    };

    const openForm = (item = null) => {
        if (item) {
            setEditId(item.id);
            setFormData(item);
        } else {
            setEditId(null);
            setFormData({ name: '', phone: '', email: '', address: '', fiscalData: '', website: '', notes: '' });
        }
        setShowModal(true);
    };

    return (
        <div>
            <div className="title-row">
                <h2>Paqueterías (Logística)</h2>
                <button className="btn btn-primary" onClick={() => openForm()}><Plus size={18} /> Nueva Paquetería</button>
            </div>

            <div className="card table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Teléfono</th>
                            <th>Correo</th>
                            <th>Sitio Web</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map(item => (
                            <tr key={item.id}>
                                <td>{item.name}</td>
                                <td>{item.phone}</td>
                                <td>{item.email}</td>
                                <td>{item.website}</td>
                                <td>
                                    <button className="btn" style={{ padding: '5px', color: 'var(--warning)', background: 'transparent' }} onClick={() => openForm(item)}><Edit size={18} /></button>
                                    <button className="btn" style={{ padding: '5px', color: 'var(--error)', background: 'transparent' }} onClick={() => handleDelete(item.id)}><Trash2 size={18} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{editId ? 'Editar' : 'Nueva'} Paquetería</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>Cerrar</button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleSubmit}>
                                <div className="form-group"><label>Nombre de la paquetería</label><input required className="form-control" type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                                <div className="form-group"><label>Número de contacto</label><input className="form-control" type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div>
                                <div className="form-group"><label>Correo electrónico</label><input className="form-control" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
                                <div className="form-group"><label>Dirección</label><textarea className="form-control" value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })} /></div>
                                <div className="form-group"><label>Datos fiscales</label><textarea className="form-control" value={formData.fiscalData || ''} onChange={e => setFormData({ ...formData, fiscalData: e.target.value })} /></div>
                                <div className="form-group"><label>Sitio Web</label><input className="form-control" type="text" value={formData.website || ''} onChange={e => setFormData({ ...formData, website: e.target.value })} /></div>
                                <div className="form-group"><label>Notas</label><textarea className="form-control" value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} /></div>
                                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>Guardar</button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default Logistics;
