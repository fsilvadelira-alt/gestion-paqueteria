import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Search, Archive, Trash2, Edit } from 'lucide-react';

const History = () => {
    const [packages, setPackages] = useState([]);
    const [carriers, setCarriers] = useState([]);
    const [recipients, setRecipients] = useState([]);
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCarrier, setFilterCarrier] = useState('');

    const [logistics, setLogistics] = useState([]);

    const [showGastoModal, setShowGastoModal] = useState(false);
    const [gastoForm, setGastoForm] = useState({
        packageId: null,
        logisticsCompanyId: '',
        shippingCost: '',
        shippingIsBilled: false,
        shippingNotes: '',
        noAplica: false
    });

    const fetchData = async () => {
        try {
            const [resPkg, resCarr, resRec, resLog] = await Promise.all([
                api.get('/packages'),
                api.get('/carriers'),
                api.get('/recipients'),
                api.get('/logistics')
            ]);
            // Sort descending by creation date
            const sorted = resPkg.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setPackages(sorted);
            setCarriers(resCarr.data);
            setRecipients(resRec.data);
            setLogistics(resLog.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const togglePayment = async (pkg) => {
        try {
            await api.put(`/packages/${pkg.id}`, { scheduledForPayment: !pkg.scheduledForPayment });
            fetchData();
        } catch (error) {
            console.error('Error toggling payment', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar esta compra?')) {
            if (window.confirm('ESTA ACCIÓN ES IRREVERSIBLE. Se eliminará la compra y todos sus registros de gastos asociados. ¿Confirmar eliminación total?')) {
                try {
                    await api.delete(`/packages/${id}`);
                    fetchData();
                } catch (error) {
                    console.error('Error al eliminar compra', error);
                    alert('Error al eliminar la compra');
                }
            }
        }
    };

    const handleGastoSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/packages/${gastoForm.packageId}`, {
                logisticsCompanyId: gastoForm.noAplica ? null : (gastoForm.logisticsCompanyId || null),
                shippingCost: gastoForm.noAplica ? 0 : (parseFloat(gastoForm.shippingCost) || 0),
                shippingIsBilled: gastoForm.noAplica ? false : gastoForm.shippingIsBilled,
                shippingNotes: gastoForm.shippingNotes,
                shippingCostAssigned: true
            });
            setShowGastoModal(false);
            setGastoForm({ packageId: null, logisticsCompanyId: '', shippingCost: '', shippingIsBilled: false, shippingNotes: '', noAplica: false });
            fetchData();
        } catch (error) {
            console.error(error);
            alert('Error al registrar gasto');
        }
    };

    const renderStatus = (status) => {
        const classMap = {
            'En camino': 'status-encamino',
            'Recibido': 'status-recibido',
            'Listo para entregar': 'status-entregado',
            'Incorrecto': 'status-error',
            'Defectuoso': 'status-error',
            'Entregado': 'status-entregado'
        };
        return <span className={`status-badge ${classMap[status] || 'status-encamino'}`}>{status}</span>;
    };

    const filteredData = packages.filter(p => {
        const matchTracking = p.trackingNumber ? p.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) : true;
        const matchDesc = p.description ? p.description.toLowerCase().includes(searchTerm.toLowerCase()) : true;
        
        const matchSearch = matchTracking || matchDesc;
        const matchStatus = filterStatus ? p.status === filterStatus : true;
        const matchCarrier = filterCarrier ? p.carrierId?.toString() === filterCarrier : true;

        return matchSearch && matchStatus && matchCarrier;
    });

    return (
        <div>
            <div className="title-row">
                <h2><Archive size={24} style={{ marginRight: '10px' }} /> Histórico de Ventas</h2>
            </div>

            <div className="card">
                <div style={{ display: 'flex', marginBottom: '15px', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: '1 1 200px' }}>
                        <Search size={18} style={{ position: 'absolute', top: '12px', left: '10px', color: 'var(--text-secondary)' }} />
                        <input type="text" className="form-control" placeholder="Buscar descripción o guía..." style={{ paddingLeft: '35px' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <select className="form-control" style={{ flex: '1 1 150px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        <option value="">Todos los Estados</option>
                        <option value="En camino">En camino</option>
                        <option value="Recibido">Recibido</option>
                        <option value="Listo para entregar">Listo para entregar</option>
                        <option value="Incorrecto">Incorrecto</option>
                        <option value="Defectuoso">Defectuoso</option>
                        <option value="Entregado">Entregado</option>
                    </select>
                    <select className="form-control" style={{ flex: '1 1 150px' }} value={filterCarrier} onChange={e => setFilterCarrier(e.target.value)}>
                        <option value="">Todos los Proveedores</option>
                        {carriers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {(searchTerm || filterStatus || filterCarrier) && (
                        <button className="btn" style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)' }} onClick={() => {
                            setSearchTerm(''); setFilterStatus(''); setFilterCarrier(''); 
                        }}>Limpiar</button>
                    )}
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Fecha Registro</th>
                                <th>Descripción Principal</th>
                                <th>Destino</th>
                                <th>Proveedor (Suministro)</th>
                                <th>Monto Inicial (MXN)</th>
                                <th>Envío (Logística)</th>
                                <th>Costo Total</th>
                                <th>Programado a Pago</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map(p => {
                                const needsShipping = !p.shippingCostAssigned;
                                const totalCost = parseFloat(p.amountMXN || 0) + parseFloat(p.shippingCost || 0);
                                return (
                                <tr key={p.id}>
                                    <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                                    <td>{p.description ? (p.description.length > 30 ? p.description.substring(0,30)+'...' : p.description) : (p.trackingNumber || '-')}</td>
                                    <td>{p.finalRecipient?.name || '-'}</td>
                                    <td>{p.carrier?.name || '-'}</td>
                                    <td>${parseFloat(p.amountMXN || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td>
                                        {needsShipping ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#b45309' }}>
                                                <span title="Falta gasto de envío">⚠️</span>
                                                <button className="btn btn-sm" onClick={() => {
                                                    setGastoForm({ packageId: p.id, logisticsCompanyId: '', shippingCost: '', shippingIsBilled: false, shippingNotes: '', noAplica: false });
                                                    setShowGastoModal(true);
                                                }} style={{ padding: '2px 5px', fontSize: '12px', background: '#f59e0b', color: 'white' }}>Asignar Envío</button>
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: '13px', position: 'relative' }}>
                                                <strong>{p.logisticsCompany?.name || 'Local / Otro'}</strong><br/>
                                                ${parseFloat(p.shippingCost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <br/>
                                                <small style={{ color: p.shippingIsBilled ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                                                    {p.shippingIsBilled ? 'Facturado' : 'No Facturado'}
                                                </small>
                                                {p.shippingAdmin && (
                                                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                                                        Admin: {p.shippingAdmin?.name}
                                                    </div>
                                                )}
                                                <button className="btn" style={{ position: 'absolute', top: '-5px', right: '-5px', padding: '2px', background: 'transparent', color: 'var(--primary-color)' }} onClick={() => {
                                                    setGastoForm({ 
                                                        packageId: p.id, 
                                                        logisticsCompanyId: p.logisticsCompanyId || '', 
                                                        shippingCost: p.shippingCost || 0, 
                                                        shippingIsBilled: p.shippingIsBilled || false, 
                                                        shippingNotes: p.shippingNotes || '',
                                                        noAplica: p.shippingCost === 0 && !p.logisticsCompanyId
                                                    });
                                                    setShowGastoModal(true);
                                                }} title="Editar Gasto">
                                                    <Edit size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                    <td><strong>${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button 
                                            className="btn" 
                                            onClick={() => togglePayment(p)}
                                            style={{ 
                                                padding: '5px 10px', 
                                                background: p.scheduledForPayment ? '#10b981' : '#ef4444', 
                                                color: 'white',
                                                minWidth: '40px'
                                            }}
                                        >
                                            {p.scheduledForPayment ? '✔️' : '✖️'}
                                        </button>
                                    </td>
                                    <td>{renderStatus(p.status)}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button className="btn" style={{ padding: '5px', color: 'var(--error)', background: 'transparent' }} onClick={() => handleDelete(p.id)} title="Eliminar del Histórico">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                                );
                            })}
                            {filteredData.length === 0 && (
                                <tr>
                                    <td colSpan="11" style={{ textAlign: 'center', padding: '20px' }}>No hay registros en el histórico.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showGastoModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3>Gasto Paquetería/Envío</h3>
                            <button className="modal-close" onClick={() => setShowGastoModal(false)}>Cerrar</button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleGastoSubmit}>
                                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fef3c7', padding: '10px', borderRadius: '5px' }}>
                                    <input type="checkbox" id="noAplica" checked={gastoForm.noAplica} onChange={e => setGastoForm({ ...gastoForm, noAplica: e.target.checked })} />
                                    <label htmlFor="noAplica" style={{ marginBottom: 0, fontWeight: 'bold', color: '#b45309' }}>Ninguno / No Aplica (Exento de Gasto)</label>
                                </div>
                                {!gastoForm.noAplica && (
                                    <>
                                        <div className="form-group">
                                            <label>Paquetería / Proveedor de Logística</label>
                                            <select className="form-control" value={gastoForm.logisticsCompanyId} onChange={e => setGastoForm({ ...gastoForm, logisticsCompanyId: e.target.value })}>
                                                <option value="">(Local / Otro)</option>
                                                {logistics.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Costo del Envío (MXN)</label>
                                            <input required className="form-control" type="number" step="0.01" value={gastoForm.shippingCost} onChange={e => setGastoForm({ ...gastoForm, shippingCost: e.target.value })} />
                                        </div>
                                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <input type="checkbox" id="gastoIsBilled" checked={gastoForm.shippingIsBilled} onChange={e => setGastoForm({ ...gastoForm, shippingIsBilled: e.target.checked })} />
                                            <label htmlFor="gastoIsBilled" style={{ marginBottom: 0 }}>Gasto Envío Facturado</label>
                                        </div>
                                    </>
                                )}
                                <div className="form-group">
                                    <label>Observaciones</label>
                                    <textarea className="form-control" value={gastoForm.shippingNotes} onChange={e => setGastoForm({ ...gastoForm, shippingNotes: e.target.value })} placeholder={gastoForm.noAplica ? 'Especifica por qué no aplica...' : ''} />
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>Guardar Gasto/Envío</button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default History;
