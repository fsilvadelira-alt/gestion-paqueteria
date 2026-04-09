import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { Plus, Send, FileText, Calendar, Filter, Building2, MapPin, User, Trash2, Phone, Notebook, Edit, Clock, TrendingUp, PieChart, BarChart3, Trophy, XCircle, Archive } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';
import { AuthContext } from '../context/AuthContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

const Quotes = () => {
    const { user: currentUser } = useContext(AuthContext);
    const [quotes, setQuotes] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [zones, setZones] = useState([]);
    const [recipients, setRecipients] = useState([]);
    const [users, setUsers] = useState([]);
    
    // Filter by Tab: Todas, Pendientes, Enviadas, Histórico
    const [activeTab, setActiveTab] = useState('Todas');
    
    const [formData, setFormData] = useState({
        requestDate: new Date().toISOString().split('T')[0],
        commitmentDate: '',
        description: '',
        recipientId: '',
        status: 'Pendiente',
        internalNotes: '',
        sentAt: '',
        sentBy: '',
        cost: ''
    });
    
    // Modals
    const [showModal, setShowModal] = useState(false);
    const [showFolioModal, setShowFolioModal] = useState(false);
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [showWonModal, setShowWonModal] = useState(false);
    const [showLostModal, setShowLostModal] = useState(false);
    const [showRecoverModal, setShowRecoverModal] = useState(false);
    
    const [editId, setEditId] = useState(null);
    
    // For hierarchies in form
    const [formCompany, setFormCompany] = useState('');
    const [formZone, setFormZone] = useState('');
    
    // Selected quote for folio
    const [selectedQuoteId, setSelectedQuoteId] = useState(null);
    const [folioValue, setFolioValue] = useState('');

    // Won/Lost modal data
    const [wonCategory, setWonCategory] = useState('');
    const [wonPurchaseOrder, setWonPurchaseOrder] = useState('');
    const [lostReason, setLostReason] = useState('');

    const fetchData = async () => {
        try {
            const [resQ, resC, resZ, resR, resU] = await Promise.all([
                api.get('/quotes'),
                api.get('/companies'),
                api.get('/zones'),
                api.get('/recipients'),
                api.get('/auth')
            ]);
            setQuotes(resQ.data);
            setCompanies(resC.data);
            setZones(resZ.data);
            setRecipients(resR.data);
            setUsers(resU.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Limpiar strings vacíos que causarían errores de tipo en MySQL
            const payload = { ...formData };
            if (!payload.sentAt) delete payload.sentAt;
            if (!payload.sentBy) delete payload.sentBy;
            if (!payload.recipientId) delete payload.recipientId;
            if (!payload.internalNotes) payload.internalNotes = null;

            if (editId) {
                await api.put(`/quotes/${editId}`, payload);
            } else {
                await api.post('/quotes', payload);
            }
            setShowModal(false);
            setEditId(null);
            setFormData({
                requestDate: new Date().toISOString().split('T')[0],
                commitmentDate: '',
                description: '',
                recipientId: '',
                status: 'Pendiente',
                internalNotes: '',
                sentAt: '',
                sentBy: '',
                cost: ''
            });
            setFormCompany('');
            setFormZone('');
            fetchData();

        } catch (error) {
            const msg = error.response?.data?.message || error.message || 'Error desconocido';
            alert('Error al guardar cotización: ' + msg);
        }
    };

    const handleCallToggle = async (id, callField, currentValue) => {
        try {
            await api.put(`/quotes/${id}`, { [callField]: !currentValue });
            fetchData();
        } catch (error) {
            console.error("Error toggling call", error);
        }
    };

    const handleMarkAsSent = (id) => {
        setSelectedQuoteId(id);
        setFolioValue('');
        setShowFolioModal(true);
    };

    const submitFolio = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/quotes/${selectedQuoteId}`, {
                status: 'Enviado',
                folio: folioValue
            });
            setShowFolioModal(false);
            fetchData();
        } catch (error) {
            alert('Error al actualizar cotización');
        }
    };

    const handleSaveNotes = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/quotes/${editId}`, { internalNotes: formData.internalNotes });
            setShowNotesModal(false);
            setEditId(null);
            fetchData();
        } catch (error) {
            alert('Error al guardar notas');
        }
    };

    const handleDelete = async (id) => {
        if(window.confirm('¿Deseas eliminar esta cotización?')) {
            try {
                await api.delete(`/quotes/${id}`);
                fetchData();
            } catch (error) {
                alert('Error al eliminar');
            }
        }
    };

    const openWonModal = (id) => {
        setSelectedQuoteId(id);
        setWonCategory('');
        setWonPurchaseOrder('');
        setShowWonModal(true);
    };

    const submitWon = async (e) => {
        e.preventDefault();
        if (!wonCategory) { alert('Debes seleccionar una categoría'); return; }
        try {
            await api.post(`/quotes/${selectedQuoteId}/won`, {
                category: wonCategory,
                purchaseOrder: wonPurchaseOrder
            });
            setShowWonModal(false);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error al marcar como Ganado');
        }
    };

    const openLostModal = (id) => {
        setSelectedQuoteId(id);
        setLostReason('');
        setShowLostModal(true);
    };

    const submitLost = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/quotes/${selectedQuoteId}/lost`, { lostReason });
            setShowLostModal(false);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error al marcar como Perdido');
        }
    };

    const openRecoverModal = (id) => {
        setSelectedQuoteId(id);
        setShowRecoverModal(true);
    };

    const submitRecover = async () => {
        try {
            await api.post(`/quotes/${selectedQuoteId}/recover`);
            setShowRecoverModal(false);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error al recuperar cotización');
        }
    };

    const openEdit = (q) => {
        setEditId(q.id);
        setFormData({
            requestDate: q.requestDate ? new Date(q.requestDate).toISOString().split('T')[0] : '',
            commitmentDate: q.commitmentDate ? new Date(q.commitmentDate).toISOString().split('T')[0] : '',
            description: q.description || '',
            recipientId: q.recipientId || '',
            status: q.status || 'Pendiente',
            internalNotes: q.internalNotes || '',
            sentAt: q.sentAt ? new Date(q.sentAt).toISOString().slice(0, 16) : '',
            sentBy: q.sentBy || '',
            cost: q.cost || ''
        });
        if (q.recipient) {
            setFormCompany(q.recipient.companyId || '');
            setFormZone(q.recipient.zoneId || '');
        }
        setShowModal(true);
    };

    const openNotes = (q) => {
        setEditId(q.id);
        setFormData({
            ...formData,
            status: q.status,
            internalNotes: q.internalNotes || ''
        });
        setShowNotesModal(true);
    };

    const getPriorityColor = (date) => {
        if (!date) return 'var(--text-secondary)';
        const diffTime = new Date(date) - new Date();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= 3) return '#10b981';
        if (diffDays === 2) return '#f59e0b';
        return '#ef4444';
    };

    const calculateAvgResponseTime = () => {
        const sentQuotes = quotes.filter(q => q.status === 'Enviado' && q.sentAt);
        if (sentQuotes.length === 0) return '0h';
        const totalMs = sentQuotes.reduce((acc, q) => acc + (new Date(q.sentAt) - new Date(q.requestDate)), 0);
        const avgMs = totalMs / sentQuotes.length;
        const avgHours = avgMs / (1000 * 60 * 60);
        if (avgHours < 24) return `${avgHours.toFixed(1)}h`;
        return `${(avgHours / 24).toFixed(1)}d`;
    };

    const getTrendData = () => {
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const data = last7Days.map(date => {
            const dayQuotes = quotes.filter(q => q.status === 'Enviado' && q.sentAt && q.sentAt.split('T')[0] === date);
            if (dayQuotes.length === 0) return 0;
            const avg = dayQuotes.reduce((acc, q) => acc + (new Date(q.sentAt) - new Date(q.requestDate)), 0) / dayQuotes.length;
            return (avg / (1000 * 60 * 60)).toFixed(1);
        });

        return {
            labels: last7Days,
            datasets: [{
                label: 'Tiempos de Respuesta (Horas)',
                data: data,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true
            }]
        };
    };

    const getStatusPieData = () => {
        return {
            labels: ['Pendientes', 'Enviadas', 'Ganadas', 'Perdidas'],
            datasets: [{
                data: [
                    quotes.filter(q => q.status === 'Pendiente').length,
                    quotes.filter(q => q.status === 'Enviado').length,
                    quotes.filter(q => q.status === 'Ganado').length,
                    quotes.filter(q => q.status === 'Perdido').length
                ],
                backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'],
                borderWidth: 0
            }]
        };
    };

    if (currentUser?.role !== 'Admin') {
        return (
            <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
                <FileText size={48} style={{ color: 'var(--text-secondary)', marginBottom: '20px' }} />
                <h3>Acceso Restringido</h3>
                <p>Esta sección contiene información confidencial y solo es accesible para Administradores.</p>
            </div>
        );
    }

    // Tab filtering
    const filteredQuotes = quotes.filter(q => {
        if (activeTab === 'Todas') return q.status === 'Pendiente' || q.status === 'Enviado' || q.status === 'Ganado';
        if (activeTab === 'Pendientes') return q.status === 'Pendiente';
        if (activeTab === 'Enviadas') return q.status === 'Enviado';
        if (activeTab === 'Ganadas') return q.status === 'Ganado';
        return true;
    });

    const getStatusBadgeStyle = (status) => {
        const styles = {
            'Pendiente': { background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' },
            'Enviado':   { background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' },
            'Ganado':    { background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' },
            'Perdido':   { background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }
        };
        return styles[status] || {};
    };

    const tabCounts = {
        'Todas': quotes.filter(q => q.status !== 'Perdido' && q.status !== 'Cerrado').length,
        'Pendientes': quotes.filter(q => q.status === 'Pendiente').length,
        'Enviadas': quotes.filter(q => q.status === 'Enviado').length,
        'Ganadas': quotes.filter(q => q.status === 'Ganado').length
    };

    return (
        <div className="quotes-module">
            <div className="title-row">
                <h2><FileText size={24} style={{marginRight: '10px'}} /> Módulo de Cotizaciones</h2>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} /> Nueva Cotización
                </button>
            </div>

            {/* ANALYTICS DASHBOARD */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '25px' }}>
                <div className="card stats-card" style={{ borderLeft: '5px solid #3b82f6' }}>
                    <div className="stats-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}><Clock size={24} /></div>
                    <div className="stats-info"><h3>{calculateAvgResponseTime()}</h3><p>T. Promedio de Respuesta</p></div>
                </div>
                <div className="card stats-card" style={{ borderLeft: '5px solid #f59e0b' }}>
                    <div className="stats-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}><BarChart3 size={24} /></div>
                    <div className="stats-info"><h3>{quotes.filter(q => q.status === 'Pendiente').length}</h3><p>Cotizaciones en Túnel</p></div>
                </div>
                <div className="card stats-card" style={{ borderLeft: '5px solid #10b981' }}>
                    <div className="stats-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}><Trophy size={24} /></div>
                    <div className="stats-info"><h3>{quotes.filter(q => q.status === 'Ganado').length}</h3><p>Cotizaciones Ganadas</p></div>
                </div>
                <div className="card stats-card" style={{ borderLeft: '5px solid #8b5cf6' }}>
                    <div className="stats-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}><Archive size={24} /></div>
                    <div className="stats-info"><h3>{quotes.filter(q => q.status === 'Perdido' || q.status === 'Cerrado').length}</h3><p>En Histórico</p></div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '25px' }}>
                <div className="card" style={{ padding: '20px' }}>
                    <h4 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}><TrendingUp size={18} color="#3b82f6"/> Tendencia de Eficiencia (Últimos 7 días)</h4>
                    <div style={{ height: '200px' }}>
                        <Line data={getTrendData()} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, title: { display: true, text: 'Horas' } } } }} />
                    </div>
                </div>
                <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                    <h4 style={{ marginBottom: '15px' }}>Estado de Cartera</h4>
                    <div style={{ height: '200px', display: 'flex', justifyContent: 'center' }}>
                        <Pie data={getStatusPieData()} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                </div>
            </div>

            {/* Quick Filters / Tabs */}
            <div className="card" style={{ marginBottom: '15px', padding: '10px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {['Todas', 'Pendientes', 'Enviadas', 'Ganadas'].map(tab => (
                        <button 
                            key={tab} 
                            onClick={() => setActiveTab(tab)}
                            className="btn"
                            style={{
                                background: activeTab === tab ? 'var(--primary-color)' : 'transparent',
                                color: activeTab === tab ? 'white' : 'var(--text-primary)',
                                border: '1px solid var(--border-color)',
                                fontWeight: activeTab === tab ? 'bold' : 'normal',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            {tab === 'Histórico' && <Archive size={14} />}
                            {tab === 'Ganadas' && <Trophy size={14} />}
                            {tab} <span style={{ 
                                background: activeTab === tab ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)',
                                borderRadius: '10px', padding: '1px 7px', fontSize: '12px'
                            }}>{tabCounts[tab]}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ===== TABLA PRINCIPAL ===== */}
            {activeTab !== 'Histórico' && (
                <div className="card table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Folio</th>
                                <th>F. Solicitud</th>
                                <th>Cliente / Destinatario</th>
                                <th>F. Compromiso</th>
                                <th>Descripción</th>
                                <th>Seguimiento</th>
                                <th>Estatus</th>
                                <th>F. Envío / Autor</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredQuotes.map(q => (
                                <tr key={q.id}>
                                    <td style={{ fontWeight: 'bold' }}>{q.folio || 'S/I'}</td>
                                    <td>{new Date(q.requestDate).toLocaleDateString()}</td>
                                    <td>
                                        <div style={{fontSize: '13px'}}>
                                            <strong>{q.recipient?.company?.name || 'Local'}</strong><br/>
                                            <small>{q.recipient?.zone?.name || '-'}</small><br/>
                                            <span style={{color: 'var(--text-secondary)'}}>{q.recipient?.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: 'bold', color: getPriorityColor(q.commitmentDate) }}>
                                        {new Date(q.commitmentDate).toLocaleDateString()}
                                    </td>
                                    <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={q.description}>
                                        {q.description || '-'}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <span title="1er Llamada" onClick={() => handleCallToggle(q.id, 'call1', q.call1)} style={{ cursor: 'pointer', color: q.call1 ? '#10b981' : '#cbd5e1' }}><Phone size={18} /></span>
                                            <span title="2da Llamada" onClick={() => handleCallToggle(q.id, 'call2', q.call2)} style={{ cursor: 'pointer', color: q.call2 ? '#10b981' : '#cbd5e1' }}><Phone size={18} /></span>
                                            <span title="3er Llamada" onClick={() => handleCallToggle(q.id, 'call3', q.call3)} style={{ cursor: 'pointer', color: q.call3 ? '#10b981' : '#cbd5e1' }}><Phone size={18} /></span>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ 
                                            ...getStatusBadgeStyle(q.status),
                                            padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold'
                                        }}>
                                            {q.status}
                                        </span>
                                    </td>
                                    <td>
                                        {q.sentAt ? (
                                            <div style={{ fontSize: '12px' }}>
                                                {new Date(q.sentAt).toLocaleString()}<br/>
                                                <small style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>Por: {q.sender?.name || 'Sistema'}</small>
                                            </div>
                                        ) : '---'}
                                    </td>
                                    <td>
                                        <div style={{display: 'flex', gap: '4px', flexWrap: 'wrap'}}>
                                            {q.status === 'Pendiente' && (
                                                <button 
                                                    className="btn btn-sm" 
                                                    style={{ background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                                                    onClick={() => handleMarkAsSent(q.id)}
                                                    title="Marcar como Enviado"
                                                >
                                                    <Send size={13} /> Enviar
                                                </button>
                                            )}
                                            {q.status === 'Enviado' && (
                                                <>
                                                    <button 
                                                        className="btn btn-sm" 
                                                        style={{ background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                                                        onClick={() => openWonModal(q.id)}
                                                        title="Marcar como Ganado"
                                                    >
                                                        <Trophy size={13} /> Ganado
                                                    </button>
                                                    <button 
                                                        className="btn btn-sm" 
                                                        style={{ background: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                                                        onClick={() => openLostModal(q.id)}
                                                        title="Marcar como Perdido"
                                                    >
                                                        <XCircle size={13} /> Perdido
                                                    </button>
                                                </>
                                            )}
                                            <button className="btn" style={{color: 'var(--warning)', padding: '5px'}} onClick={() => openEdit(q)} title="Editar Datos"><Edit size={16} /></button>
                                            <button className="btn" style={{color: 'var(--primary-color)', padding: '5px'}} onClick={() => openNotes(q)} title="Notas de Seguimiento"><Notebook size={16} /></button>
                                            <button className="btn" style={{color: 'var(--error)', padding: '5px'}} onClick={() => handleDelete(q.id)} title="Eliminar"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredQuotes.length === 0 && (
                                <tr><td colSpan="9" style={{textAlign: 'center', padding: '30px', color: 'var(--text-secondary)'}}>No hay cotizaciones para mostrar.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ===== HISTÓRICO DE COTIZACIONES (Perdidas) ===== */}
            {activeTab === 'Histórico' && (
                <div className="card table-container">
                    <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Archive size={20} style={{ color: '#ef4444' }} />
                        <h4 style={{ margin: 0, color: '#ef4444' }}>Histórico de Cotizaciones Perdidas</h4>
                        <span style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--text-secondary)' }}>
                            Solo lectura — Los administradores pueden recuperar cotizaciones
                        </span>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Folio</th>
                                <th>F. Solicitud</th>
                                <th>Cliente / Destinatario</th>
                                <th>Descripción</th>
                                <th>F. Envío</th>
                                <th>F. Pérdida</th>
                                <th>Motivo</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredQuotes.map(q => (
                                <tr key={q.id} style={{ opacity: 0.85 }}>
                                    <td style={{ fontWeight: 'bold', color: '#ef4444' }}>{q.folio || 'S/I'}</td>
                                    <td>{new Date(q.requestDate).toLocaleDateString()}</td>
                                    <td>
                                        <div style={{fontSize: '13px'}}>
                                            <strong>{q.recipient?.company?.name || 'Local'}</strong><br/>
                                            <span style={{color: 'var(--text-secondary)'}}>{q.recipient?.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={q.description}>
                                        {q.description || '-'}
                                    </td>
                                    <td style={{ fontSize: '12px' }}>
                                        {q.sentAt ? new Date(q.sentAt).toLocaleString() : '---'}
                                    </td>
                                    <td style={{ fontSize: '12px', color: '#ef4444' }}>
                                        {q.lostAt ? new Date(q.lostAt).toLocaleDateString() : '---'}
                                    </td>
                                    <td style={{ maxWidth: '150px', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={q.lostReason}>
                                        {q.lostReason || 'Sin motivo registrado'}
                                    </td>
                                    <td>
                                        <button 
                                            className="btn btn-sm" 
                                            style={{ background: '#8b5cf6', color: 'white', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', whiteSpace: 'nowrap' }}
                                            onClick={() => openRecoverModal(q.id)}
                                            title="Recuperar Cotización"
                                        >
                                            <TrendingUp size={13} /> Recuperar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredQuotes.length === 0 && (
                                <tr><td colSpan="8" style={{textAlign: 'center', padding: '30px', color: 'var(--text-secondary)'}}>No hay cotizaciones en el histórico.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ============================
                MODALS
            ============================ */}

            {/* CREATE/EDIT MODAL */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{maxWidth: '600px'}}>
                        <div className="modal-header">
                            <h3>{editId ? 'Editar Cotización' : 'Nueva Solicitud de Cotización'}</h3>
                            <button className="modal-close" onClick={() => { setShowModal(false); setEditId(null); }}>Cerrar</button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>Descripción del requerimiento</label>
                                    <textarea required className="form-control" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Ej. Repuesto para motor de planta norte..." />
                                </div>
                                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px'}}>
                                    <div className="form-group">
                                        <label>Coste de la cotización</label>
                                        <input required className="form-control" type="number" step="0.01" min="0" value={formData.cost} onChange={e => setFormData({...formData, cost: e.target.value})} placeholder="Ej. 1500.50" />
                                    </div>
                                    <div className="form-group">
                                        <label>Fecha de Solicitud</label>
                                        <input required className="form-control" type="date" value={formData.requestDate} onChange={e => setFormData({...formData, requestDate: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>Fecha Compromiso</label>
                                        <input required className="form-control" type="date" value={formData.commitmentDate} onChange={e => setFormData({...formData, commitmentDate: e.target.value})} />
                                    </div>
                                </div>

                                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '10px' }}>
                                    <h4 style={{fontSize: '14px', marginBottom: '10px'}}>Selección Jerárquica de Cliente</h4>
                                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                                        <div className="form-group">
                                            <label><Building2 size={14}/> Empresa</label>
                                            <select className="form-control" value={formCompany} onChange={e => {setFormCompany(e.target.value); setFormZone(''); setFormData({...formData, recipientId: ''})}}>
                                                <option value="">Selecciona empresa...</option>
                                                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label><MapPin size={14}/> Zona/Depto</label>
                                            <select className="form-control" value={formZone} onChange={e => {setFormZone(e.target.value); setFormData({...formData, recipientId: ''})}} disabled={!formCompany}>
                                                <option value="">Selecciona zona...</option>
                                                {zones.filter(z => z.companyId === parseInt(formCompany)).map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group" style={{marginTop: '10px'}}>
                                        <label><User size={14}/> Destinatario Final</label>
                                        <select required className="form-control" value={formData.recipientId} onChange={e => setFormData({...formData, recipientId: e.target.value})}>
                                            <option value="">Selecciona contacto...</option>
                                            {recipients.filter(r => {
                                                if (formCompany && formZone) return r.companyId === parseInt(formCompany) && r.zoneId === parseInt(formZone);
                                                if (formCompany) return r.companyId === parseInt(formCompany);
                                                return true;
                                            }).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                
                                {formData.status === 'Enviado' && (
                                    <div style={{ background: '#f0f9ff', padding: '15px', borderRadius: '8px', border: '1px solid #bae6fd', marginTop: '15px' }}>
                                        <h4 style={{fontSize: '14px', marginBottom: '10px', color: '#0369a1'}}>Datos de Envío (Edición Manual)</h4>
                                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                                            <div className="form-group">
                                                <label><Calendar size={14}/> Fecha de Envío</label>
                                                <input className="form-control" type="datetime-local" value={formData.sentAt} onChange={e => setFormData({...formData, sentAt: e.target.value})} />
                                            </div>
                                            <div className="form-group">
                                                <label><User size={14}/> Autor (Enviado por)</label>
                                                <select className="form-control" value={formData.sentBy} onChange={e => setFormData({...formData, sentBy: e.target.value})}>
                                                    <option value="">Selecciona autor...</option>
                                                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <button type="submit" className="btn btn-primary" style={{width: '100%', marginTop: '20px', justifyContent: 'center'}}>
                                    {editId ? 'Guardar Cambios' : 'Lanzar Nueva Cotización'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* FOLIO MODAL */}
            {showFolioModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{maxWidth: '400px'}}>
                        <div className="modal-header">
                            <h3>Confirmar Envío de Cotización</h3>
                            <button className="modal-close" onClick={() => setShowFolioModal(false)}>Cerrar</button>
                        </div>
                        <div className="modal-body">
                            <p style={{marginBottom: '15px'}}>Ingresa el número de folio asignado manualmente para cerrar este ciclo:</p>
                            <form onSubmit={submitFolio}>
                                <div className="form-group">
                                    <label>Folio de Cotización</label>
                                    <input required className="form-control" autoFocus type="text" value={folioValue} onChange={e => setFolioValue(e.target.value)} placeholder="Ej. COT-2024-001" />
                                </div>
                                <button type="submit" className="btn btn-primary" style={{width: '100%', justifyContent: 'center'}}>Registrar como Enviado</button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* WON MODAL */}
            {showWonModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{maxWidth: '500px'}}>
                        <div className="modal-header" style={{background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', borderRadius: '12px 12px 0 0'}}>
                            <h3 style={{color: 'white', display: 'flex', alignItems: 'center', gap: '10px'}}><Trophy size={22} /> Marcar como GANADO</h3>
                            <button className="modal-close" style={{color: 'white'}} onClick={() => setShowWonModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <p style={{marginBottom: '15px', color: 'var(--text-secondary)'}}>
                                Esta cotización pasará a <strong>Servicios Generales</strong>. Selecciona la categoría y datos de seguimiento.
                            </p>
                            <form onSubmit={submitWon}>
                                <div className="form-group">
                                    <label style={{fontWeight: 'bold'}}>Categoría <span style={{color: '#ef4444'}}>*</span></label>
                                    <select required className="form-control" value={wonCategory} onChange={e => setWonCategory(e.target.value)}>
                                        <option value="">Selecciona categoría...</option>
                                        <option value="Reventa">Reventa</option>
                                        <option value="Subcontratacion">Subcontratación</option>
                                        <option value="Servicios">Servicios</option>
                                    </select>
                                </div>
                                {wonCategory && (
                                    <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '8px', border: '1px solid #86efac', marginBottom: '15px', fontSize: '13px' }}>
                                        <strong>Controles que se habilitarán:</strong>
                                        <ul style={{margin: '8px 0 0 16px', color: '#166534'}}>
                                            <li>Compras Internas</li>
                                            {(wonCategory === 'Subcontratacion' || wonCategory === 'Servicios') && <li>Cierre Técnico</li>}
                                            {wonCategory === 'Servicios' && <li>Ejecución</li>}
                                            <li>Cierre Comercial</li>
                                        </ul>
                                    </div>
                                )}
                                <div className="form-group">
                                    <label>Orden de Compra (opcional)</label>
                                    <input className="form-control" type="text" value={wonPurchaseOrder} onChange={e => setWonPurchaseOrder(e.target.value)} placeholder="Ej. OC-2024-0123" />
                                </div>
                                <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
                                    <button type="submit" className="btn" style={{flex: 1, background: '#10b981', color: 'white', justifyContent: 'center'}}>
                                        <Trophy size={16} style={{marginRight: '6px'}}/> Confirmar Ganado
                                    </button>
                                    <button type="button" className="btn" onClick={() => setShowWonModal(false)} style={{flex: 1, border: '1px solid var(--border-color)', justifyContent: 'center'}}>
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* LOST MODAL */}
            {showLostModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{maxWidth: '450px'}}>
                        <div className="modal-header" style={{background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', borderRadius: '12px 12px 0 0'}}>
                            <h3 style={{color: 'white', display: 'flex', alignItems: 'center', gap: '10px'}}><XCircle size={22} /> Marcar como PERDIDO</h3>
                            <button className="modal-close" style={{color: 'white'}} onClick={() => setShowLostModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <p style={{marginBottom: '15px', color: 'var(--text-secondary)'}}>
                                Esta cotización se moverá al <strong>Histórico</strong>. Podrá ser recuperada por un administrador.
                            </p>
                            <form onSubmit={submitLost}>
                                <div className="form-group">
                                    <label>Motivo de pérdida (opcional)</label>
                                    <textarea 
                                        className="form-control" 
                                        style={{minHeight: '80px'}}
                                        value={lostReason} 
                                        onChange={e => setLostReason(e.target.value)}
                                        placeholder="Ej. El cliente eligió otro proveedor por precio..."
                                    />
                                </div>
                                <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
                                    <button type="submit" className="btn" style={{flex: 1, background: '#ef4444', color: 'white', justifyContent: 'center'}}>
                                        <Archive size={16} style={{marginRight: '6px'}}/> Mover al Histórico
                                    </button>
                                    <button type="button" className="btn" onClick={() => setShowLostModal(false)} style={{flex: 1, border: '1px solid var(--border-color)', justifyContent: 'center'}}>
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* RECOVER MODAL */}
            {showRecoverModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{maxWidth: '420px'}}>
                        <div className="modal-header" style={{background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', borderRadius: '12px 12px 0 0'}}>
                            <h3 style={{color: 'white', display: 'flex', alignItems: 'center', gap: '10px'}}><TrendingUp size={22} /> Recuperar Cotización</h3>
                            <button className="modal-close" style={{color: 'white'}} onClick={() => setShowRecoverModal(false)}>✕</button>
                        </div>
                        <div className="modal-body" style={{textAlign: 'center'}}>
                            <TrendingUp size={48} style={{color: '#8b5cf6', marginBottom: '15px'}} />
                            <p style={{marginBottom: '20px'}}>
                                ¿Confirmas que deseas <strong>recuperar esta cotización</strong>?<br/>
                                <small style={{color: 'var(--text-secondary)'}}>Volverá al estado <strong>"Enviado"</strong> en la sección principal.</small>
                            </p>
                            <div style={{display: 'flex', gap: '10px', justifyContent: 'center'}}>
                                <button className="btn" style={{background: '#8b5cf6', color: 'white', justifyContent: 'center', padding: '10px 25px'}} onClick={submitRecover}>
                                    Sí, Recuperar
                                </button>
                                <button className="btn" onClick={() => setShowRecoverModal(false)} style={{border: '1px solid var(--border-color)', padding: '10px 25px', justifyContent: 'center'}}>
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* NOTES MODAL */}
            {showNotesModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{maxWidth: '500px'}}>
                        <div className="modal-header">
                            <h3><Notebook size={20} style={{marginRight: '10px'}}/> Notas Internas / Seguimiento</h3>
                            <button className="modal-close" onClick={() => setShowNotesModal(false)}>Cerrar</button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleSaveNotes}>
                                <div className="form-group">
                                    <label>Comentarios de seguimiento para la Cotización #{editId}</label>
                                    <textarea 
                                        className="form-control" 
                                        style={{ minHeight: '150px' }} 
                                        value={formData.internalNotes} 
                                        onChange={e => setFormData({...formData, internalNotes: e.target.value})}
                                        placeholder="Escribe aquí llamadas, acuerdos o actualizaciones..."
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                                        <Plus size={18} style={{marginRight: '5px'}}/> Guardar Nota
                                    </button>
                                    <button type="button" className="btn" onClick={() => setShowNotesModal(false)} style={{ flex: 1, justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Quotes;
