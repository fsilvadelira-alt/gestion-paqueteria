import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { FileText, Trophy, Package, CheckCircle, Settings, Briefcase, Link, Unlink, ChevronDown, ChevronUp, DollarSign, AlertCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import * as XLSX from 'xlsx';

// Semáforo por porcentaje
const TrafficLight = ({ value }) => {
    let color, label;
    const v = parseInt(value) || 0;
    if (v === 0) { color = '#ef4444'; label = 'Sin inicio'; }
    else if (v > 0 && v < 10) { color = '#ef4444'; label = `${v}%`; }
    else if (v >= 10 && v < 50) { color = '#f97316'; label = `${v}%`; }
    else if (v >= 50 && v < 80) { color = '#eab308'; label = `${v}%`; }
    else { color = '#10b981'; label = `${v}%`; }

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
                width: '14px', height: '14px', borderRadius: '50%',
                background: color,
                boxShadow: `0 0 8px ${color}`,
                flexShrink: 0,
                transition: 'all 0.3s ease'
            }} />
            <span style={{ fontWeight: 'bold', color, minWidth: '36px', fontSize: '14px' }}>{label}</span>
            <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: '#334155', minWidth: '60px' }}>
                <div style={{
                    width: `${v}%`, height: '100%', borderRadius: '3px',
                    background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                    transition: 'width 0.4s ease'
                }} />
            </div>
        </div>
    );
};

// Control de progreso editable
const ProgressControl = ({ label, value, field, wonQuoteId, onUpdate, icon: Icon }) => {
    const [editing, setEditing] = useState(false);
    const [localVal, setLocalVal] = useState(value);

    const handleSave = async () => {
        const v = Math.max(0, Math.min(100, parseInt(localVal) || 0));
        await onUpdate(wonQuoteId, { [field]: v });
        setEditing(false);
    };

    return (
        <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '8px', padding: '12px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {Icon && <Icon size={14} />} {label}
                </span>
                {editing ? (
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                        <input 
                            type="number" min="0" max="100"
                            value={localVal}
                            onChange={e => setLocalVal(e.target.value)}
                            style={{ width: '60px', padding: '4px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontSize: '13px' }}
                            autoFocus
                            onKeyDown={e => e.key === 'Enter' && handleSave()}
                        />
                        <button onClick={handleSave} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}>✓</button>
                        <button onClick={() => { setEditing(false); setLocalVal(value); }} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                    </div>
                ) : (
                    <button onClick={() => setEditing(true)} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: '4px', padding: '3px 8px', cursor: 'pointer', fontSize: '11px' }}>
                        Editar
                    </button>
                )}
            </div>
            <TrafficLight value={localVal} />
        </div>
    );
};

// Categoría label con color
const CategoryBadge = ({ category }) => {
    const styles = {
        'Reventa':         { bg: 'rgba(59,130,246,0.15)',  color: '#3b82f6', label: 'Reventa' },
        'Subcontratacion': { bg: 'rgba(139,92,246,0.15)', color: '#8b5cf6', label: 'Subcontratación' },
        'Servicios':       { bg: 'rgba(16,185,129,0.15)', color: '#10b981', label: 'Servicios' }
    };
    const s = styles[category] || styles['Servicios'];
    return (
        <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', border: `1px solid ${s.color}40` }}>
            {s.label}
        </span>
    );
};

const GeneralServices = () => {
    const { user: currentUser } = useContext(AuthContext);
    const [wonQuotes, setWonQuotes] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [expandedId, setExpandedId] = useState(null);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [selectedWonQuoteId, setSelectedWonQuoteId] = useState(null);
    const [selectedExpenseId, setSelectedExpenseId] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        try {
            const [resWon, resPkg] = await Promise.all([
                api.get('/quotes/won'),
                api.get('/packages')
            ]);
            setWonQuotes(resWon.data);
            setExpenses(resPkg.data); // "expenses" state holds packages (Compras)
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleProgressUpdate = async (wonQuoteId, data) => {
        try {
            await api.put(`/quotes/won/${wonQuoteId}`, data);
            fetchData();
        } catch (error) {
            alert('Error al actualizar progreso');
        }
    };

    const handlePurchaseOrderUpdate = async (wonQuoteId, purchaseOrder) => {
        try {
            await api.put(`/quotes/won/${wonQuoteId}`, { purchaseOrder });
            fetchData();
        } catch (error) {
            alert('Error al actualizar orden de compra');
        }
    };

    const openLinkModal = (wonQuoteId) => {
        setSelectedWonQuoteId(wonQuoteId);
        setSelectedExpenseId('');
        setShowLinkModal(true);
    };

    const handleLinkExpense = async () => {
        if (!selectedExpenseId) { alert('Selecciona una compra'); return; }
        setLoading(true);
        try {
            await api.post(`/quotes/won/${selectedWonQuoteId}/packages`, { packageId: parseInt(selectedExpenseId) });
            setShowLinkModal(false);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error al vincular compra');
        } finally { setLoading(false); }
    };

    const handleUnlinkExpense = async (wonQuoteId, packageId) => {
        if (!window.confirm('¿Desvincular esta compra?')) return;
        try {
            await api.delete(`/quotes/won/${wonQuoteId}/packages/${packageId}`);
            fetchData();
        } catch (error) {
            alert('Error al desvincular');
        }
    };

    const handleCloseQuote = async (wonQuoteId) => {
        if (!window.confirm('¿Estás seguro de cerrar esta cotización? Pasará al Histórico y ya no podrás editarla aquí.')) return;
        try {
            await api.post(`/quotes/won/${wonQuoteId}/close`);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error al cerrar cotización');
        }
    };

    const getControlsForCategory = (category) => {
        const all = [
            { label: 'Compras Internas', field: 'internalPurchasesProgress', icon: Package },
            { label: 'Ejecución', field: 'executionProgress', icon: Briefcase },
            { label: 'Cierre Técnico', field: 'technicalCloseProgress', icon: Settings },
            { label: 'Cierre Comercial', field: 'commercialCloseProgress', icon: CheckCircle }
        ];
        if (category === 'Reventa')         return all.filter(c => ['internalPurchasesProgress', 'commercialCloseProgress'].includes(c.field));
        if (category === 'Subcontratacion') return all.filter(c => ['internalPurchasesProgress', 'technicalCloseProgress', 'commercialCloseProgress'].includes(c.field));
        if (category === 'Servicios')       return all;
        return [];
    };

    const calcTotalLinkedExpenses = (wq) => {
        if (!wq.linkedPackages || wq.linkedPackages.length === 0) return 0;
        return wq.linkedPackages.reduce((acc, pkg) => acc + (parseFloat(pkg.amountMXN) || 0), 0);
    };

    const calcTotalOperationalExpenses = (wq) => {
        if (!wq.operationalExpenses || wq.operationalExpenses.length === 0) return 0;
        return wq.operationalExpenses.reduce((acc, exp) => acc + (parseFloat(exp.amount) || 0), 0);
    };

    // Get already linked package IDs to avoid duplicates in selector
    const getLinkedExpenseIds = (wonQuoteId) => {
        const wq = wonQuotes.find(w => w.id === wonQuoteId);
        if (!wq || !wq.linkedPackages) return [];
        return wq.linkedPackages.map(p => p.id);
    };

    if (currentUser?.role !== 'Admin') {
        return (
            <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
                <Trophy size={48} style={{ color: 'var(--text-secondary)', marginBottom: '20px' }} />
                <h3>Acceso Restringido</h3>
                <p>Esta sección es solo para Administradores.</p>
            </div>
        );
    }

    const exportToExcel = () => {
        const data = wonQuotes.map(wq => {
            const quote = wq.quote;
            const totalLinked = calcTotalLinkedExpenses(wq);
            const totalOpExp = calcTotalOperationalExpenses(wq);
            const quoteCost = parseFloat(quote?.cost) || 0;
            const profit = quoteCost - (totalLinked + totalOpExp);

            return {
                'Folio': quote?.folio || 'S/I',
                'Cliente': `${quote?.recipient?.company?.name || 'Local'} - ${quote?.recipient?.name || 'Sin contacto'}`,
                'Descripción': quote?.description || '',
                'Categoría': wq.category || '',
                'Coste de la cotización': quoteCost,
                'Total compras internas': totalLinked,
                'Total gastos operativos': totalOpExp,
                'Ganancia del proyecto': profit,
                '% Compras internas': wq.internalPurchasesProgress || 0,
                '% Ejecución': ['Servicios'].includes(wq.category) ? (wq.executionProgress || 0) : 'N/A',
                '% Cierre técnico': ['Subcontratacion', 'Servicios'].includes(wq.category) ? (wq.technicalCloseProgress || 0) : 'N/A',
                '% Cierre comercial': wq.commercialCloseProgress || 0,
                'Estado actual': 'Activo (Ganado)'
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Servicios Activos');
        XLSX.writeFile(workbook, 'Reporte_Servicios_Generales.xlsx');
    };

    return (
        <div>
            {/* Header */}
            <div className="title-row">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Trophy size={24} style={{ color: '#10b981' }} /> Servicios Generales
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button className="btn btn-primary" onClick={exportToExcel} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <FileText size={16} /> Exportar a Excel
                    </button>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {wonQuotes.length} servicio{wonQuotes.length !== 1 ? 's' : ''} activo{wonQuotes.length !== 1 ? 's' : ''}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                {['Reventa', 'Subcontratacion', 'Servicios'].map(cat => {
                    const count = wonQuotes.filter(w => w.category === cat).length;
                    const colors = { Reventa: '#3b82f6', Subcontratacion: '#8b5cf6', Servicios: '#10b981' };
                    const labels = { Reventa: 'Reventa', Subcontratacion: 'Subcontratación', Servicios: 'Servicios' };
                    return (
                        <div key={cat} className="card stats-card" style={{ borderLeft: `5px solid ${colors[cat]}` }}>
                            <div className="stats-icon" style={{ background: `${colors[cat]}20`, color: colors[cat] }}>
                                <Trophy size={22} />
                            </div>
                            <div className="stats-info">
                                <h3 style={{ color: colors[cat] }}>{count}</h3>
                                <p>{labels[cat]}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Service Cards */}
            {wonQuotes.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: '50px', color: 'var(--text-secondary)' }}>
                    <Trophy size={48} style={{ opacity: 0.3, marginBottom: '15px' }} />
                    <h3>Sin servicios activos</h3>
                    <p>Las cotizaciones marcadas como <strong>Ganadas</strong> aparecerán aquí.</p>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {wonQuotes.map(wq => {
                    const quote = wq.quote;
                    const controls = getControlsForCategory(wq.category);
                    const linkedPackages = wq.linkedPackages || [];
                    const totalLinked = calcTotalLinkedExpenses(wq);
                    const totalOpExp = calcTotalOperationalExpenses(wq);
                    const quoteCost = parseFloat(quote?.cost) || 0;
                    const profit = quoteCost - (totalLinked + totalOpExp);
                    const isExpanded = expandedId === wq.id;
                    
                    const isFullyComplete = controls.length > 0 && controls.every(ctrl => wq[ctrl.field] === 100);

                    return (
                        <div key={wq.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            {/* Card Header */}
                            <div 
                                style={{ 
                                    padding: '16px 20px', 
                                    cursor: 'pointer',
                                    display: 'grid',
                                    gridTemplateColumns: 'auto 1fr auto auto auto',
                                    gap: '16px',
                                    alignItems: 'center',
                                    background: isExpanded ? 'rgba(16,185,129,0.05)' : 'transparent',
                                    borderBottom: isExpanded ? '1px solid var(--border-color)' : 'none'
                                }}
                                onClick={() => setExpandedId(isExpanded ? null : wq.id)}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Trophy size={18} color="#10b981" />
                                    <span style={{ fontWeight: 'bold', fontSize: '15px' }}>{quote?.folio || 'S/I'}</span>
                                </div>
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: '500' }}>
                                        {quote?.recipient?.company?.name || 'Sin empresa'} — {quote?.recipient?.name || 'Sin contacto'}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {quote?.description || 'Sin descripción'}
                                    </div>
                                </div>
                                <CategoryBadge category={wq.category} />
                                <div style={{ textAlign: 'right', fontSize: '12px' }}>
                                    {wq.purchaseOrder ? (
                                        <span style={{ color: '#10b981', fontWeight: 'bold' }}>OC: {wq.purchaseOrder}</span>
                                    ) : (
                                        <span style={{ color: 'var(--text-secondary)' }}>Sin OC</span>
                                    )}
                                    <br/>
                                    <span style={{ color: 'var(--text-secondary)' }}>{new Date(wq.wonAt).toLocaleDateString()}</span>
                                </div>
                                <div style={{ color: 'var(--text-secondary)' }}>
                                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </div>
                            </div>

                            {/* Card Expanded Body */}
                            {isExpanded && (
                                <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px' }}>
                                    {/* Left: Controls */}
                                    <div>
                                        <h4 style={{ marginBottom: '14px', fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Settings size={14} /> Control de Avance
                                        </h4>

                                        {/* Orden de compra editable */}
                                        <PurchaseOrderField 
                                            value={wq.purchaseOrder}
                                            wonQuoteId={wq.id}
                                            onUpdate={handlePurchaseOrderUpdate}
                                        />

                                        {controls.map(ctrl => (
                                            <ProgressControl
                                                key={ctrl.field}
                                                label={ctrl.label}
                                                value={wq[ctrl.field]}
                                                field={ctrl.field}
                                                wonQuoteId={wq.id}
                                                onUpdate={handleProgressUpdate}
                                                icon={ctrl.icon}
                                            />
                                        ))}

                                        {isFullyComplete && (
                                            <div style={{ marginTop: '20px' }}>
                                                <button 
                                                    className="btn btn-primary"
                                                    style={{ width: '100%', justifyContent: 'center', background: '#10b981', border: 'none', padding: '10px' }}
                                                    onClick={() => handleCloseQuote(wq.id)}
                                                >
                                                    <CheckCircle size={18} style={{ marginRight: '8px' }} /> Cerrar Cotización
                                                </button>
                                                <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                                                    Todos los avances están al 100%. El proyecto pasará al Histórico.
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right: Financials & Linked Expenses */}
                                    <div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                                            <div style={{ background: 'rgba(59,130,246,0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.3)' }}>
                                                <div style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 'bold' }}>COSTE COTIZACIÓN</div>
                                                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>${quoteCost.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
                                            </div>
                                            <div style={{ background: profit >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', padding: '12px', borderRadius: '8px', border: `1px solid ${profit >= 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                                                <div style={{ fontSize: '11px', color: profit >= 0 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>GANANCIA PROYECTO</div>
                                                <div style={{ fontSize: '16px', fontWeight: 'bold', color: profit >= 0 ? '#10b981' : '#ef4444' }}>${profit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                            <h4 style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                                                <DollarSign size={14} /> Compras Internas Vinculadas
                                            </h4>
                                            <button 
                                                onClick={() => openLinkModal(wq.id)}
                                                style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}
                                            >
                                                <Link size={12} /> Vincular
                                            </button>
                                        </div>

                                        {linkedPackages.length === 0 ? (
                                            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.1)', borderRadius: '8px', fontSize: '13px' }}>
                                                <AlertCircle size={24} style={{ marginBottom: '8px', opacity: 0.5 }} /><br/>
                                                Sin compras vinculadas
                                            </div>
                                        ) : (
                                            <div>
                                                {linkedPackages.map(pkg => (
                                                    <div key={pkg.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(0,0,0,0.15)', borderRadius: '6px', marginBottom: '6px' }}>
                                                        <div>
                                                            <div style={{ fontSize: '13px', fontWeight: '500' }}>{pkg.description || pkg.purchaseType || 'Sin descripción'}</div>
                                                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                                                {pkg.requisitionDate ? new Date(pkg.requisitionDate).toLocaleDateString() : '---'}
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <span style={{ fontWeight: 'bold', color: '#10b981', fontSize: '14px' }}>
                                                                ${parseFloat(pkg.amountMXN || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                            </span>
                                                            <button 
                                                                onClick={() => handleUnlinkExpense(wq.id, pkg.id)}
                                                                title="Desvincular"
                                                                style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'none', borderRadius: '4px', padding: '4px 6px', cursor: 'pointer' }}
                                                            >
                                                                <Unlink size={13} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 12px', borderTop: '1px solid var(--border-color)', marginTop: '6px' }}>
                                                    <div style={{ textAlign: 'right', width: '100%' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                                                            <span style={{ color: 'var(--text-secondary)' }}>Total compras vinculadas:</span>
                                                            <span style={{ fontWeight: 'bold' }}>${totalLinked.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                                                            <span style={{ color: 'var(--text-secondary)' }}>Total gastos operativos:</span>
                                                            <span style={{ fontWeight: 'bold' }}>${totalOpExp.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed var(--border-color)' }}>
                                                            <span style={{ color: '#ef4444', fontWeight: 'bold' }}>Gastos Totales:</span>
                                                            <span style={{ color: '#ef4444', fontWeight: 'bold' }}>
                                                                ${(totalLinked + totalOpExp).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* LINK EXPENSE MODAL */}
            {showLinkModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Link size={18} /> Vincular Compra</h3>
                            <button className="modal-close" onClick={() => setShowLinkModal(false)}>Cerrar</button>
                        </div>
                        <div className="modal-body">
                            <p style={{ marginBottom: '15px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                                Selecciona una compra de la sección <strong>Compras</strong> para vincularla a esta cotización ganada.
                            </p>
                            <div className="form-group">
                                <label>Compra disponible</label>
                                <select 
                                    className="form-control" 
                                    value={selectedExpenseId} 
                                    onChange={e => setSelectedExpenseId(e.target.value)}
                                >
                                    <option value="">Selecciona una compra...</option>
                                    {expenses
                                        .filter(pkg => !getLinkedExpenseIds(selectedWonQuoteId).includes(pkg.id))
                                        .map(pkg => (
                                            <option key={pkg.id} value={pkg.id}>
                                                {pkg.description || pkg.purchaseType || 'Sin descripción'} — ${parseFloat(pkg.amountMXN || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} ({pkg.requisitionDate ? new Date(pkg.requisitionDate).toLocaleDateString() : '---'})
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>
                            {expenses.filter(pkg => !getLinkedExpenseIds(selectedWonQuoteId).includes(pkg.id)).length === 0 && (
                                <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px', padding: '10px', fontSize: '13px', color: '#f59e0b', marginBottom: '10px' }}>
                                    No hay compras disponibles para vincular (todas ya están vinculadas o no existen registros).
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button 
                                    className="btn btn-primary" 
                                    style={{ flex: 1, justifyContent: 'center' }}
                                    onClick={handleLinkExpense}
                                    disabled={loading || !selectedExpenseId}
                                >
                                    <Link size={16} /> {loading ? 'Vinculando...' : 'Vincular Compra'}
                                </button>
                                <button className="btn" onClick={() => setShowLinkModal(false)} style={{ flex: 1, justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Sub-componente para editar orden de compra inline
const PurchaseOrderField = ({ value, wonQuoteId, onUpdate }) => {
    const [editing, setEditing] = useState(false);
    const [localVal, setLocalVal] = useState(value || '');

    const handleSave = () => {
        onUpdate(wonQuoteId, localVal);
        setEditing(false);
    };

    return (
        <div style={{ background: 'rgba(16,185,129,0.08)', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Orden de Compra</span>
                {editing ? (
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                        <input 
                            type="text"
                            value={localVal}
                            onChange={e => setLocalVal(e.target.value)}
                            style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontSize: '13px' }}
                            placeholder="Ej. OC-2024-001"
                            autoFocus
                            onKeyDown={e => e.key === 'Enter' && handleSave()}
                        />
                        <button onClick={handleSave} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}>✓</button>
                        <button onClick={() => { setEditing(false); setLocalVal(value || ''); }} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                    </div>
                ) : (
                    <button onClick={() => setEditing(true)} style={{ background: 'transparent', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', borderRadius: '4px', padding: '3px 8px', cursor: 'pointer', fontSize: '11px' }}>
                        {value ? 'Editar' : '+ Agregar'}
                    </button>
                )}
            </div>
            <div style={{ fontWeight: 'bold', fontSize: '15px', marginTop: '4px', color: value ? '#10b981' : 'var(--text-secondary)' }}>
                {localVal || 'Sin orden de compra'}
            </div>
        </div>
    );
};

export default GeneralServices;
