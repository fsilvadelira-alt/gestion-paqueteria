import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { Plus, Edit, Trash2, Search, Camera, PackageCheck, Send } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Packages = () => {
    const { user } = useContext(AuthContext);
    const [packages, setPackages] = useState([]);
    const [carriers, setCarriers] = useState([]);
    const [recipients, setRecipients] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [zones, setZones] = useState([]);

    const [formCompany, setFormCompany] = useState('');
    const [formZone, setFormZone] = useState('');
    
    // modals visibility
    const [showModal, setShowModal] = useState(false);
    const [showUnboxingModal, setShowUnboxingModal] = useState(false);
    const [showDeliveryModal, setShowDeliveryModal] = useState(false);
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCarrier, setFilterCarrier] = useState('');
    const [filterRecipient, setFilterRecipient] = useState('');
    const [filterDate, setFilterDate] = useState('');

    const [isUSD, setIsUSD] = useState(false);
    const [amountUSD, setAmountUSD] = useState('');

    const initialForm = {
        requisitionDate: '',
        trackingNumber: '',
        purchaseType: '',
        carrierId: '',
        recipientId: '',
        amountMXN: 0,
        description: '',
        arrivalDate: '',
        paymentMethod: 'Transferencia',
        isBilled: false,
        status: 'En camino',
        personReceiving: ''
    };

    const [formData, setFormData] = useState(initialForm);
    const [editId, setEditId] = useState(null);

    // Unboxing state
    const [unboxingId, setUnboxingId] = useState(null);
    const [unboxingForm, setUnboxingForm] = useState({ status: 'Listo para entregar', unboxingPhoto: '' });

    // Delivery state
    const [deliveryId, setDeliveryId] = useState(null);
    const [deliveryForm, setDeliveryForm] = useState({ deliveryPhoto: '', deliveryNotes: '' });

    const fetchData = async () => {
        try {
            const [resPkg, resCarr, resRec, resComp, resZone] = await Promise.all([
                api.get('/packages'),
                api.get('/carriers'),
                api.get('/recipients'),
                api.get('/companies'),
                api.get('/zones')
            ]);
            setPackages(resPkg.data);
            setCarriers(resCarr.data);
            setRecipients(resRec.data);
            setCompanies(resComp.data);
            setZones(resZone.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAmountChange = async (val, usdMode) => {
        if (!usdMode) {
            setFormData(prev => ({ ...prev, amountMXN: val }));
        } else {
            setAmountUSD(val);
            if (val > 0) {
                try {
                    const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
                    const data = await res.json();
                    const rate = data.rates.MXN;
                    setFormData(prev => ({ ...prev, amountMXN: (val * rate).toFixed(2) }));
                } catch (e) {
                    console.error('Error fetching exchange rate:', e);
                }
            } else {
                setFormData(prev => ({ ...prev, amountMXN: 0 }));
            }
        }
    };

    const handlePhoto = (e, setter, field) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setter(prev => ({ ...prev, [field]: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    // Generic Add/Edit Submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editId) {
                const pkg = packages.find(p => p.id === editId);
                if (formData.status === 'Recibido' && pkg?.status !== 'Recibido') {
                    alert('📦 ¡Nueva compra recibida!');
                }
                await api.put(`/packages/${editId}`, formData);
            } else {
                if (formData.status === 'Recibido') {
                    alert('📦 ¡Nueva compra recibida!');
                }
                await api.post('/packages', formData);
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Error al guardar');
        }
    };

    // Unboxing Submit
    const handleUnboxingSubmit = async (e) => {
        e.preventDefault();
        if (!unboxingForm.unboxingPhoto) {
            if (!window.confirm('⚠️ No has adjuntado una fotografía del estado del paquete. ¿Deseas continuar el unboxing sin evidencia?')) return;
        }
        try {
            await api.put(`/packages/${unboxingId}`, {
                status: unboxingForm.status,
                unboxingPhoto: unboxingForm.unboxingPhoto
            });
            setShowUnboxingModal(false);
            fetchData();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Error al procesar unboxing');
        }
    };

    // Delivery Submit
    const handleDeliverySubmit = async (e) => {
        e.preventDefault();
        if (!deliveryForm.deliveryPhoto) {
            if (!window.confirm('⚠️ No has adjuntado foto de confirmación de entrega. ¿Deseas registrar la entrega sin evidencia visual?')) return;
        }
        if (!window.confirm('¿Confirmar entrega definitiva al destinatario?')) return;
        try {
            await api.put(`/packages/${deliveryId}`, {
                status: 'Entregado',
                deliveryPhoto: deliveryForm.deliveryPhoto,
                deliveryNotes: deliveryForm.deliveryNotes
            });
            setShowDeliveryModal(false);
            fetchData();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Error al procesar entrega');
        }
    };

    const handleReceive = async (pkgId) => {
        if (window.confirm('¿Confirmar que la compra ha sido recibida físicamente?')) {
            try {
                await api.put(`/packages/${pkgId}`, { status: 'Recibido' });
                fetchData();
            } catch (error) {
                console.error(error);
                alert('Error al recibir compra');
            }
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Eliminar compra?')) {
            await api.delete(`/packages/${id}`);
            fetchData();
        }
    };

    const openEdit = (pkg) => {
        setEditId(pkg.id);
        const formatLocalDate = (dateString) => {
            if (!dateString) return '';
            return new Date(dateString).toISOString().split('T')[0];
        };
        setFormData({
            trackingNumber: pkg.trackingNumber || '',
            requisitionDate: formatLocalDate(pkg.requisitionDate),
            purchaseType: pkg.purchaseType || '',
            carrierId: pkg.carrierId || '',
            recipientId: pkg.recipientId || '',
            amountMXN: pkg.amountMXN || 0,
            description: pkg.description || '',
            arrivalDate: formatLocalDate(pkg.arrivalDate) || formatLocalDate(pkg.receptionDate),
            paymentMethod: pkg.paymentMethod || 'Transferencia',
            isBilled: pkg.isBilled || false,
            status: pkg.status || 'En camino',
            personReceiving: pkg.personReceiving || ''
        });
        setIsUSD(false);
        setAmountUSD('');
        
        // Find recipient's company to pre-fill the filters
        if (pkg.recipientId) {
            const rec = recipients.find(r => r.id === pkg.recipientId);
            if (rec) {
                setFormCompany(rec.companyId ? rec.companyId.toString() : '');
                setFormZone(rec.zoneId ? rec.zoneId.toString() : '');
            } else {
                setFormCompany('');
                setFormZone('');
            }
        } else {
            setFormCompany('');
            setFormZone('');
        }
        
        setShowModal(true);
    };

    const openUnboxing = (pkg) => {
        setUnboxingId(pkg.id);
        setUnboxingForm({
            status: pkg.status === 'Recibido' ? 'Listo para entregar' : pkg.status,
            unboxingPhoto: pkg.unboxingPhoto || ''
        });
        setShowUnboxingModal(true);
    };

    const openDelivery = (pkg) => {
        setDeliveryId(pkg.id);
        setDeliveryForm({
            deliveryPhoto: pkg.deliveryPhoto || '',
            deliveryNotes: pkg.deliveryNotes || ''
        });
        setShowDeliveryModal(true);
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
        const matchRecipient = filterRecipient ? p.recipientId?.toString() === filterRecipient : true;

        let matchDate = true;
        if (filterDate) {
            const pDate = new Date(p.createdAt).toISOString().split('T')[0];
            matchDate = pDate === filterDate;
        }

        return matchSearch && matchStatus && matchCarrier && matchRecipient && matchDate && p.status !== 'Entregado';
    });

    return (
        <div>
            <div className="title-row">
                <h2>Compras</h2>
                {user?.role === 'Admin' && (
                    <button className="btn btn-primary" onClick={() => {
                        setEditId(null);
                        setFormData(initialForm);
                        setIsUSD(false);
                        setAmountUSD('');
                        setFormCompany('');
                        setFormZone('');
                        setShowModal(true);
                    }}>
                        <Plus size={18} /> Agregar Compra
                    </button>
                )}
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
                    </select>
                    <select className="form-control" style={{ flex: '1 1 150px' }} value={filterCarrier} onChange={e => setFilterCarrier(e.target.value)}>
                        <option value="">Todos los Proveedores</option>
                        {carriers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select className="form-control" style={{ flex: '1 1 150px' }} value={filterRecipient} onChange={e => setFilterRecipient(e.target.value)}>
                        <option value="">Todos los Destinatarios</option>
                        {recipients.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                    <input type="date" className="form-control" style={{ flex: '1 1 150px' }} value={filterDate} onChange={e => setFilterDate(e.target.value)} title="Filtrar por Fecha" />
                    {(searchTerm || filterStatus || filterCarrier || filterRecipient || filterDate) && (
                        <button className="btn" style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)' }} onClick={() => {
                            setSearchTerm(''); setFilterStatus(''); setFilterCarrier(''); setFilterRecipient(''); setFilterDate('');
                        }}>Limpiar</button>
                    )}
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Descripción</th>
                                <th>Tipo</th>
                                <th>Proveedor</th>
                                <th>Destino</th>
                                <th>Estado</th>
                                <th>Monto (MXN)</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map(p => (
                                <tr key={p.id}>
                                    <td>{p.description ? (p.description.length > 30 ? p.description.substring(0,30)+'...' : p.description) : (p.trackingNumber || '-')}</td>
                                    <td>{p.purchaseType || '-'}</td>
                                    <td>{p.carrier?.name}</td>
                                    <td>{p.finalRecipient?.name}</td>
                                    <td>{renderStatus(p.status)}</td>
                                    <td>${parseFloat(p.amountMXN || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                            {/* Receive Button for everyone */}
                                            {p.status === 'En camino' && (
                                                <button className="btn btn-sm" style={{ padding: '4px 8px', background: '#3b82f6', color: 'white', fontSize: '13px' }} onClick={() => handleReceive(p.id)}>
                                                    Recibir Compra
                                                </button>
                                            )}
                                            {/* Unboxing Button for Admins */}
                                            {p.status === 'Recibido' && user?.role === 'Admin' && (
                                                <button className="btn" style={{ padding: '5px', color: '#8b5cf6', background: 'transparent' }} onClick={() => openUnboxing(p)} title="Hacer Unboxing">
                                                    <PackageCheck size={18} />
                                                </button>
                                            )}
                                            {/* Delivery Button for everyone */}
                                            {p.status === 'Listo para entregar' && (
                                                <button className="btn" style={{ padding: '5px', color: '#10b981', background: 'transparent' }} onClick={() => openDelivery(p)} title="Entregar Compra">
                                                    <Send size={18} />
                                                </button>
                                            )}
                                            {/* Normal Edit (Admin only to prevent normal user modifications) */}
                                            {user?.role === 'Admin' && (
                                                <button className="btn" style={{ padding: '5px', color: 'var(--warning)', background: 'transparent' }} onClick={() => openEdit(p)} title="Editar Detalles">
                                                    <Edit size={18} />
                                                </button>
                                            )}
                                            {/* Normal Delete */}
                                            {user?.role === 'Admin' && (
                                                <button className="btn" style={{ padding: '5px', color: 'var(--error)', background: 'transparent' }} onClick={() => handleDelete(p.id)} title="Eliminar">
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MAIN EDIT/ADD MODAL */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="modal-header">
                            <h3>{editId ? 'Editar Detalle de Compra' : 'Agregar Nueva Compra'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>Cerrar</button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleSubmit}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label>Fecha de Requisición</label>
                                        <input className="form-control" type="date" value={formData.requisitionDate} onChange={e => setFormData({ ...formData, requisitionDate: e.target.value })} title="Fecha informativa" />
                                    </div>
                                    <div className="form-group">
                                        <label>Tipo de compra</label>
                                        <input required className="form-control" type="text" value={formData.purchaseType} onChange={e => setFormData({ ...formData, purchaseType: e.target.value })} />
                                    </div>
                                    <div className="form-group" style={{ gridColumn: '1 / -1', background: 'var(--card-bg)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                        <h4 style={{ marginBottom: '10px', color: 'var(--primary-color)' }}>Filtros de Búsqueda de Destinatario</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                            <div className="form-group">
                                                <label>1. Filtrar por Empresa / Cliente</label>
                                                <select className="form-control" value={formCompany} onChange={e => { setFormCompany(e.target.value); setFormZone(''); setFormData({...formData, recipientId: ''}); }}>
                                                    <option value="">Ver de todas las empresas</option>
                                                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>2. Filtrar por Zona / Departamento</label>
                                                <select className="form-control" value={formZone} onChange={e => { setFormZone(e.target.value); setFormData({...formData, recipientId: ''}); }} disabled={!formCompany}>
                                                    <option value="">Todas las zonas</option>
                                                    {zones.filter(z => z.companyId === parseInt(formCompany)).map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="form-group" style={{ marginTop: '15px' }}>
                                            <label>3. Contacto Final / Recibe</label>
                                            <select required className="form-control" value={formData.recipientId} onChange={e => setFormData({ ...formData, recipientId: e.target.value })}>
                                                <option value="">Seleccionar destinatario...</option>
                                                {recipients.filter(r => {
                                                    if (formCompany && formZone) return r.companyId === parseInt(formCompany) && r.zoneId === parseInt(formZone);
                                                    if (formCompany) return r.companyId === parseInt(formCompany);
                                                    return true;
                                                }).map(r => <option key={r.id} value={r.id}>{r.name} {r.company ? `(${r.company.name})` : ''}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label>Descripción de la compra</label>
                                        <textarea required className="form-control" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                                    </div>

                                    <div className="form-group">
                                        <label>Proveedor</label>
                                        <select required className="form-control" value={formData.carrierId} onChange={e => setFormData({ ...formData, carrierId: e.target.value })}>
                                            <option value="">Seleccionar...</option>
                                            {carriers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Fecha de llegada</label>
                                        <input required className="form-control" type="date" value={formData.arrivalDate} onChange={e => setFormData({ ...formData, arrivalDate: e.target.value })} />
                                    </div>

                                    <div className="form-group" style={{ gridColumn: '1 / -1', border: '1px solid var(--border-color)', padding: '10px', borderRadius: '5px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                            <input type="checkbox" checked={isUSD} onChange={e => setIsUSD(e.target.checked)} />
                                            <span>¿Monto en dólares (USD)? (Convierte a MXN)</span>
                                        </label>
                                        {isUSD ? (
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <label>Monto USD</label>
                                                    <input className="form-control" type="number" step="0.01" value={amountUSD} onChange={e => handleAmountChange(e.target.value, true)} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <label>Equivalente MXN</label>
                                                    <input className="form-control" type="number" value={formData.amountMXN} readOnly style={{ background: '#f5f5f5' }} />
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <label>Monto en MXN</label>
                                                <input required className="form-control" type="number" step="0.01" value={formData.amountMXN} onChange={e => setFormData({ ...formData, amountMXN: e.target.value })} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label>Método de pago</label>
                                        <select className="form-control" value={formData.paymentMethod} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}>
                                            <option value="Transferencia">Transferencia</option>
                                            <option value="Tarjeta de crédito">Tarjeta de crédito</option>
                                            <option value="Efectivo">Efectivo</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '100%' }}>
                                            <input type="checkbox" checked={formData.isBilled} onChange={e => setFormData({ ...formData, isBilled: e.target.checked })} />
                                            <span>Compra Facturada</span>
                                        </label>
                                    </div>

                                    <div className="form-group" style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
                                        <label>Estado Principal</label>
                                        <select className="form-control" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                            <option value="En camino">En camino</option>
                                            <option value="Recibido">Recibido</option>
                                        </select>
                                        <small style={{ color: 'var(--text-secondary)' }}>
                                            * Para hacer el unboxing y entregas utiliza los botones especiales en la tabla respectiva.
                                        </small>
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '20px' }}>Guardar Cambios</button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* UNBOXING MODAL */}
            {showUnboxingModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3>Formulario de Unboxing</h3>
                            <button className="modal-close" onClick={() => setShowUnboxingModal(false)}>Cerrar</button>
                        </div>
                        <div className="modal-body" style={{ background: '#f9fafb', padding: '15px', borderRadius: '5px' }}>
                            <form onSubmit={handleUnboxingSubmit}>
                                <div className="form-group">
                                    <label>Resultado del Unboxing</label>
                                    <select required className="form-control" value={unboxingForm.status} onChange={e => setUnboxingForm({ ...unboxingForm, status: e.target.value })}>
                                        <option value="Listo para entregar">En buenas condiciones (Listo para entregar)</option>
                                        <option value="Incorrecto">Incorrecto (Regresar)</option>
                                        <option value="Defectuoso">Defectuoso o en mal estado (Regresar)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Tomar foto del pedido (Opcional) <Camera size={16}/></label>
                                    <input type="file" accept="image/*" capture="environment" className="form-control" onChange={(e) => handlePhoto(e, setUnboxingForm, 'unboxingPhoto')} />
                                    {unboxingForm.unboxingPhoto && <img src={unboxingForm.unboxingPhoto} alt="Unboxing" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', marginTop: '10px', borderRadius: '5px' }} />}
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', background: '#8b5cf6', borderColor: '#8b5cf6' }}>Confirmar Unboxing</button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* DELIVERY MODAL */}
            {showDeliveryModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3>Entrega al Destinatario</h3>
                            <button className="modal-close" onClick={() => setShowDeliveryModal(false)}>Cerrar</button>
                        </div>
                        <div className="modal-body" style={{ background: '#f0fdf4', padding: '15px', borderRadius: '5px' }}>
                            <form onSubmit={handleDeliverySubmit}>
                                <div className="form-group">
                                    <label>Confirmación fotográfica/Entrega (Opcional) <Camera size={16}/></label>
                                    <input type="file" accept="image/*" capture="environment" className="form-control" onChange={(e) => handlePhoto(e, setDeliveryForm, 'deliveryPhoto')} />
                                    {deliveryForm.deliveryPhoto && <img src={deliveryForm.deliveryPhoto} alt="Delivery" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', marginTop: '10px', borderRadius: '5px' }} />}
                                </div>
                                <div className="form-group">
                                    <label>Comentarios o problemas (Opcional)</label>
                                    <textarea className="form-control" value={deliveryForm.deliveryNotes} onChange={e => setDeliveryForm({ ...deliveryForm, deliveryNotes: e.target.value })} />
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', background: '#10b981', borderColor: '#10b981' }}>Registrar Entrega</button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Packages;
