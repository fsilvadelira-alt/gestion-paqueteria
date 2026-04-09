import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { Plus, Edit, Trash2, Download } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Expenses = () => {
    const { user } = useContext(AuthContext);
    const [data, setData] = useState([]);
    const [users, setUsers] = useState([]);
    const [recipients, setRecipients] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ concept: '', amount: '', description: '', isFacturado: false, type: 'gasto', receiver: '', date: new Date().toISOString().split('T')[0] });
    const [editId, setEditId] = useState(null);

    const fetchData = async () => {
        try {
            const expensesRes = await api.get('/expenses');
            setData(expensesRes.data);
            
            // Carga paralela de complementos
            api.get('/recipients').then(res => setRecipients(res.data)).catch(() => {});
            
            // Intentar cargar usuarios
            try {
                const usersRes = await api.get('/auth');
                setUsers(usersRes.data);
            } catch (userErr) {
                setUsers([]);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (editId) await api.put(`/expenses/${editId}`, formData);
        else await api.post('/expenses', formData);
        setShowModal(false);
        fetchData();
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Eliminar gasto?')) {
            await api.delete(`/expenses/${id}`);
            fetchData();
        }
    };

    const openForm = (item = null, isIngreso = false) => {
        if (item) {
            setEditId(item.id);
            setFormData({ 
                ...item, 
                isFacturado: item.isFacturado || false,
                type: item.type || 'gasto',
                receiver: item.receiver || '',
                date: item.date ? new Date(item.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
            });
        } else {
            setEditId(null);
            setFormData({ 
                concept: isIngreso ? 'Relleno de caja chica' : '', 
                amount: '', 
                description: '', 
                isFacturado: false, 
                type: isIngreso ? 'ingreso' : 'gasto', 
                receiver: '', 
                date: new Date().toISOString().split('T')[0] 
            });
        }
        setShowModal(true);
    };

    // Calcular Saldo
    const balance = Array.isArray(data) ? data.reduce((acc, curr) => {
        const typeStr = curr.type ? String(curr.type).toLowerCase() : 'gasto';
        const amount = parseFloat(curr.amount) || 0;
        return typeStr === 'ingreso' ? acc + amount : acc - amount;
    }, 0) : 0;

    const handleExport = async () => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const config = {
                responseType: 'blob',
                headers: {
                    Authorization: `Bearer ${userInfo?.token}`
                }
            };
            const res = await api.get('/exports/all', config);
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Reporte_ICAUTOMATION.xlsx');
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error('Error exporting expenses', error);
            alert('Error al exportar gastos. Solo disponible para administradores.');
        }
    };

    return (
        <div>
            <div className="title-row" style={{ flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <h2>Caja Chica</h2>
                    <div style={{ background: balance >= 0 ? '#dcfce7' : '#fee2e2', color: balance >= 0 ? '#166534' : '#991b1b', padding: '5px 15px', borderRadius: '20px', fontWeight: 'bold' }}>
                        Saldo: ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {user?.role === 'Admin' && (
                        <button className="btn" style={{ background: 'var(--success)', color: 'white' }} onClick={handleExport}>
                            <Download size={18} /> Exportar
                        </button>
                    )}
                    <button className="btn" style={{ background: '#10b981', color: 'white' }} onClick={() => openForm(null, true)}>
                        <Plus size={18} /> Rellenar Caja Chica
                    </button>
                    <button className="btn btn-primary" onClick={() => openForm(null, false)}>
                        <Plus size={18} /> Nuevo Gasto
                    </button>
                </div>
            </div>

            <div className="card table-container">
                <table>
                    <thead>
                        <tr><th>Fecha</th><th>Tipo</th><th>Concepto</th><th>Receptor</th><th>Monto</th><th>Facturado</th><th>Registrado Por</th><th>Acciones</th></tr>
                    </thead>
                    <tbody>
                        {data.map(item => (
                            <tr key={item.id}>
                                <td>{new Date(item.date).toLocaleDateString()}</td>
                                <td>
                                    <span style={{ 
                                        padding: '4px 8px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 'bold',
                                        background: item.type === 'ingreso' ? '#dcfce7' : '#fee2e2', 
                                        color: item.type === 'ingreso' ? '#166534' : '#991b1b' 
                                    }}>
                                        {item.type === 'ingreso' ? 'Ingreso' : 'Egreso'}
                                    </span>
                                </td>
                                <td>{item.concept}</td>
                                <td>{item.receiver || '-'}</td>
                                <td style={{ color: item.type === 'ingreso' ? '#166534' : '#991b1b', fontWeight: 'bold' }}>
                                    {item.type === 'ingreso' ? '+' : '-'}${Number(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td>{item.type === 'gasto' ? (item.isFacturado ? 'Sí' : 'No') : '-'}</td>
                                <td>{item.user?.name}</td>
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
                            <h3>{editId ? 'Editar' : 'Nuevo'} {formData.type === 'ingreso' ? 'Ingreso (Relleno)' : 'Gasto'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>Cerrar</button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleSubmit}>
                                <div className="form-group"><label>Tipo de Movimiento</label>
                                    <select className="form-control" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                        <option value="gasto">Gasto (Egreso)</option>
                                        <option value="ingreso">Relleno (Ingreso Interno)</option>
                                    </select>
                                </div>
                                <div className="form-group"><label>Fecha</label><input required className="form-control" type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} /></div>
                                <div className="form-group"><label>Concepto</label><input required className="form-control" type="text" value={formData.concept} onChange={e => setFormData({ ...formData, concept: e.target.value })} /></div>
                                
                                {formData.type === 'gasto' && (
                                    <div className="form-group">
                                        <label>Recibe / Receptor (Usuario o Persona Externa)</label>
                                        <input 
                                            className="form-control" 
                                            type="text" 
                                            value={formData.receiver} 
                                            onChange={e => setFormData({ ...formData, receiver: e.target.value })} 
                                            list="receivers-suggestions"
                                            placeholder="Escribe un nombre o selecciona de la lista..."
                                        />
                                        <datalist id="receivers-suggestions">
                                            {/* Sugerencias de Usuarios del Sistema */}
                                            {users.map(u => <option key={`u-${u.id}`} value={u.name} />)}
                                            {/* Sugerencias de Destinatarios Frecuentes */}
                                            {recipients.map(r => <option key={`r-${r.id}`} value={r.name} />)}
                                            {/* Sugerencias de Nombres ya usados anteriormente */}
                                            {[...new Set(data.map(i => i.receiver))].filter(Boolean).map((name, idx) => (
                                                <option key={`prev-${idx}`} value={name} />
                                            ))}
                                        </datalist>
                                        <small style={{ color: '#64748b', fontSize: '11px' }}>* Puedes escribir libremente si la persona no está en la lista.</small>
                                    </div>
                                )}

                                <div className="form-group"><label>Monto</label><input required className="form-control" type="number" step="0.01" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} /></div>
                                <div className="form-group"><label>Observaciones / Descripción</label><textarea className="form-control" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} /></div>
                                
                                {formData.type === 'gasto' && (
                                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <input type="checkbox" id="facturado" checked={formData.isFacturado} onChange={e => setFormData({ ...formData, isFacturado: e.target.checked })} />
                                        <label htmlFor="facturado" style={{ marginBottom: 0 }}>¿Facturado?</label>
                                    </div>
                                )}

                                {formData.amount && (
                                    <div style={{ padding: '10px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '5px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Saldo actual: ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                        <div style={{ fontWeight: 'bold', color: formData.type === 'ingreso' ? '#166534' : '#991b1b' }}>
                                            Saldo final proyectado tras guardar: ${(
                                                formData.type === 'ingreso' 
                                                ? balance + (parseFloat(formData.amount) || 0)
                                                : balance - (parseFloat(formData.amount) || 0)
                                            ).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                )}
                                
                                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>Guardar</button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default Expenses;
