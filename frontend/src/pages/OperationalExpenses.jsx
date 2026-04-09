import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { DollarSign, Plus, Trash2, Calendar, FileText, CheckCircle } from 'lucide-react';

const OperationalExpenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [wonQuotes, setWonQuotes] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        wonQuoteId: ''
    });

    const fetchData = async () => {
        try {
            const [expRes, quotesRes] = await Promise.all([
                api.get('/quotes/operational-expenses'),
                api.get('/quotes/won')
            ]);
            setExpenses(expRes.data);
            setWonQuotes(quotesRes.data);
        } catch (error) {
            console.error('Error fetching data', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/quotes/operational-expenses', formData);
            setShowModal(false);
            setFormData({
                description: '',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                wonQuoteId: ''
            });
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error al guardar gasto');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Deseas eliminar este gasto operativo?')) {
            try {
                await api.delete(`/quotes/operational-expenses/${id}`);
                fetchData();
            } catch (error) {
                alert('Error al eliminar');
            }
        }
    };

    return (
        <div className="quotes-module">
            <div className="title-row">
                <h2><DollarSign size={24} style={{ marginRight: '10px' }} /> Gastos Operativos de Proyectos</h2>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} /> Nuevo Gasto Operativo
                </button>
            </div>

            <div className="card table-container" style={{ marginTop: '20px' }}>
                <table>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Proyecto Asignado (Folio)</th>
                            <th>Descripción del Gasto</th>
                            <th>Monto Registrado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {expenses.map(exp => (
                            <tr key={exp.id}>
                                <td>{new Date(exp.date).toLocaleDateString()}</td>
                                <td>
                                    <strong>{exp.wonQuote?.quote?.folio || 'Sin Folio'}</strong><br/>
                                    <small style={{color: 'var(--text-secondary)'}}>{exp.wonQuote?.quote?.description}</small>
                                </td>
                                <td>{exp.description}</td>
                                <td style={{ fontWeight: 'bold', color: '#ef4444' }}>
                                    ${parseFloat(exp.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </td>
                                <td>
                                    <button className="btn" style={{ color: 'var(--error)', padding: '5px' }} onClick={() => handleDelete(exp.id)} title="Eliminar Gasto">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {expenses.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                                    No hay gastos operativos registrados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3>Registrar Gasto Operativo</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>Proyecto (Cotización Ganada)</label>
                                    <select 
                                        required 
                                        className="form-control" 
                                        value={formData.wonQuoteId} 
                                        onChange={e => setFormData({ ...formData, wonQuoteId: e.target.value })}
                                    >
                                        <option value="">Selecciona un proyecto...</option>
                                        {wonQuotes.map(wq => (
                                            <option key={wq.id} value={wq.id}>
                                                {wq.quote?.folio || 'S/F'} - {wq.quote?.description?.substring(0, 30)}...
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Descripción del Gasto</label>
                                    <input 
                                        required 
                                        className="form-control" 
                                        type="text" 
                                        value={formData.description} 
                                        onChange={e => setFormData({ ...formData, description: e.target.value })} 
                                        placeholder="Ej. Viáticos, material extra..."
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div className="form-group">
                                        <label>Monto</label>
                                        <input 
                                            required 
                                            className="form-control" 
                                            type="number" 
                                            step="0.01" 
                                            min="0"
                                            value={formData.amount} 
                                            onChange={e => setFormData({ ...formData, amount: e.target.value })} 
                                            placeholder="1500.00"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Fecha</label>
                                        <input 
                                            required 
                                            className="form-control" 
                                            type="date" 
                                            value={formData.date} 
                                            onChange={e => setFormData({ ...formData, date: e.target.value })} 
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '15px', justifyContent: 'center' }}>
                                    Guardar Gasto
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OperationalExpenses;
