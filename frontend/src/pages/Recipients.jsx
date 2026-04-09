import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, Building, MapPin, Users as UsersIcon } from 'lucide-react';

const Recipients = () => {
    const [recipients, setRecipients] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [zones, setZones] = useState([]);
    
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', department: '', phone: '', email: '', notes: '', companyId: '', zoneId: '' });
    const [editId, setEditId] = useState(null);
    
    const [expandedCompanies, setExpandedCompanies] = useState({});
    
    // Nueva funcionalidad de edición de nombres
    const [editEntity, setEditEntity] = useState(null); // { type: 'company' | 'zone', id, name, originalName }

    const fetchData = async () => {
        try {
            const [resRec, resComp, resZone] = await Promise.all([
                api.get('/recipients'),
                api.get('/companies'),
                api.get('/zones')
            ]);
            setRecipients(resRec.data);
            setCompanies(resComp.data);
            setZones(resZone.data);
            
            // Auto expand all by default initially or maintain
            const expanded = { ...expandedCompanies };
            resComp.data.forEach(c => {
                if (expanded[c.id] === undefined) expanded[c.id] = true;
            });
            expanded['unassigned'] = true;
            setExpandedCompanies(expanded);
        } catch (error) {
            console.error("Error fetching dependencies", error);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const toggleCompany = (id) => {
        setExpandedCompanies(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleAddCompany = async () => {
        const name = window.prompt('Nombre de la nueva Empresa / Cliente:');
        if (name && name.trim()) {
            try {
                await api.post('/companies', { name: name.trim() });
                fetchData();
            } catch (error) {
                alert('Error al crear la empresa');
            }
        }
    };

    const handleAddZone = async () => {
        if (companies.length === 0) return alert("Crea primero una Empresa.");
        // A simple prompt is tricky to select company, let's just make it a prompt for the name but they must pick company in the recipient modal. 
        // Actually, let's create a custom modal for zones or just create it when they select a company.
        alert('Para añadir una Zona, créala directamente editando la lista o puedes crear un Destinatario y solicitar que se añada la zona al sistema (o puedes usar el Gestor que armaremos pronto).');
    };

    const handleQuickAddZone = async (companyId) => {
        const name = window.prompt('Nombre de la Zona/Departamento para esta empresa:');
        if (name && name.trim()) {
            try {
                await api.post('/zones', { name: name.trim(), companyId });
                fetchData();
            } catch (error) {
                alert('Error al crear zona');
            }
        }
    }

    const handleEditEntity = (type, entity) => {
        setEditEntity({ type, id: entity.id, name: entity.name, originalName: entity.name, companyId: entity.companyId });
    };

    const saveEntityEdit = async () => {
        if (!editEntity.name || !editEntity.name.trim()) return alert('El nombre no puede estar vacío');
        if (editEntity.name.trim() === editEntity.originalName) return setEditEntity(null);

        // Validation duplicates locally first
        if (editEntity.type === 'company') {
            if (companies.some(c => c.name.toLowerCase() === editEntity.name.trim().toLowerCase() && c.id !== editEntity.id)) {
                return alert('Ya existe una empresa con ese nombre');
            }
        } else {
            if (zones.some(z => z.companyId === editEntity.companyId && z.name.toLowerCase() === editEntity.name.trim().toLowerCase() && z.id !== editEntity.id)) {
                return alert('Ya existe un departamento con ese nombre en esta empresa');
            }
        }

        if (window.confirm(`¿Confirmas que deseas cambiar "${editEntity.originalName}" por "${editEntity.name.trim()}"?`)) {
            try {
                const endpoint = editEntity.type === 'company' ? `/companies/${editEntity.id}` : `/zones/${editEntity.id}`;
                await api.put(endpoint, { name: editEntity.name.trim() });
                setEditEntity(null);
                fetchData();
            } catch (error) {
                alert(error.response?.data?.message || `Error al actualizar ${editEntity.type === 'company' ? 'la empresa' : 'el departamento'}`);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = { ...formData, companyId: formData.companyId || null, zoneId: formData.zoneId || null };
        try {
            if (editId) await api.put(`/recipients/${editId}`, payload);
            else await api.post('/recipients', payload);
            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error(error);
            alert("Error al guardar destinatario");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Eliminar destinatario? Esto podría afectar históricos vinculados a este contacto si no tienes cuidado.')) {
            try {
                await api.delete(`/recipients/${id}`);
                fetchData();
            } catch (error) {
                console.error(error);
                alert("Error al eliminar destinatario");
            }
        }
    };

    const openForm = (item = null) => {
        if (item) {
            setEditId(item.id);
            setFormData({
                name: item.name,
                department: item.department || '',
                phone: item.phone || '',
                email: item.email || '',
                notes: item.notes || '',
                companyId: item.companyId || '',
                zoneId: item.zoneId || ''
            });
        } else {
            setEditId(null);
            setFormData({ name: '', department: '', phone: '', email: '', notes: '', companyId: '', zoneId: '' });
        }
        setShowModal(true);
    };

    // Agrupamiento
    const grouped = {};
    companies.forEach(c => {
        grouped[c.id] = { company: c, zones: {}, withoutZone: [] };
    });
    grouped['unassigned'] = { company: { id: 'unassigned', name: 'Sin Empresa Asignada (Contactos Locales / Antiguos)' }, zones: {}, withoutZone: [] };

    recipients.forEach(r => {
        const compId = r.companyId || 'unassigned';
        if (!grouped[compId]) {
            grouped[compId] = { company: { id: compId, name: 'Empresa Desconocida' }, zones: {}, withoutZone: [] };
        }
        
        if (r.zoneId) {
            if (!grouped[compId].zones[r.zoneId]) {
                const zName = zones.find(z => z.id === r.zoneId)?.name || 'Zona Desconocida';
                grouped[compId].zones[r.zoneId] = { id: r.zoneId, name: zName, recipients: [] };
            }
            grouped[compId].zones[r.zoneId].recipients.push(r);
        } else {
            grouped[compId].withoutZone.push(r);
        }
    });

    // Zonas de la empresa seleccionada en el form
    const availableZonesForm = zones.filter(z => z.companyId === parseInt(formData.companyId));

    return (
        <div>
            <div className="title-row" style={{ flexWrap: 'wrap', gap: '10px' }}>
                <h2><UsersIcon size={24} style={{ marginRight: '10px' }} /> Directorio de Destinatarios</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn" style={{ background: '#475569', color: 'white' }} onClick={handleAddCompany}>
                        <Building size={18} /> Nueva Empresa
                    </button>
                    <button className="btn btn-primary" onClick={() => openForm()}>
                        <Plus size={18} /> Nuevo Destinatario
                    </button>
                </div>
            </div>

            <div className="card">
                {Object.values(grouped).map(group => {
                    const hasItems = group.withoutZone.length > 0 || Object.keys(group.zones).length > 0;
                    if (!hasItems && group.company.id === 'unassigned') return null;

                    const isExpanded = expandedCompanies[group.company.id];

                    return (
                        <div key={group.company.id} style={{ marginBottom: '15px', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                            <div 
                                onClick={() => toggleCompany(group.company.id)} 
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                                    padding: '12px 15px', background: 'rgba(79, 70, 229, 0.1)', cursor: 'pointer',
                                    borderBottom: isExpanded ? '1px solid var(--border-color)' : 'none'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                    <Building size={18} /> {group.company.name}
                                    {group.company.id !== 'unassigned' && (
                                        <button 
                                            className="btn btn-sm" 
                                            style={{ background: 'transparent', color: 'var(--warning)', padding: '2px' }} 
                                            onClick={(e) => { e.stopPropagation(); handleEditEntity('company', group.company); }}
                                            title="Editar nombre de la empresa"
                                        >
                                            <Edit size={14} />
                                        </button>
                                    )}
                                </div>
                                {group.company.id !== 'unassigned' && (
                                    <button 
                                        className="btn btn-sm" 
                                        style={{ background: 'transparent', color: 'var(--text-secondary)', padding: '5px' }} 
                                        onClick={(e) => { e.stopPropagation(); handleQuickAddZone(group.company.id); }}
                                        title="Agregar nueva zona a esta empresa"
                                    >
                                        <Plus size={16} /> Zona/Depto
                                    </button>
                                )}
                            </div>

                            {isExpanded && (
                                <div style={{ padding: '15px', background: 'var(--bg-color)' }}>
                                    {/* Mostrar zonas */}
                                    {Object.values(group.zones).map(zoneData => (
                                        <div key={zoneData.id} style={{ marginBottom: '15px', marginLeft: '10px' }}>
                                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--success)' }}>
                                                <MapPin size={16} /> {zoneData.name}
                                                <button 
                                                    className="btn btn-sm" 
                                                    style={{ background: 'transparent', color: 'var(--warning)', padding: '2px' }} 
                                                    onClick={(e) => { e.stopPropagation(); handleEditEntity('zone', { ...zoneData, companyId: group.company.id }); }}
                                                    title="Editar nombre del departamento"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                            </h4>
                                            <div className="table-container">
                                                <table style={{ background: 'var(--card-bg)' }}>
                                                    <thead>
                                                        <tr><th>Nombre</th><th>Puesto/Depto Viejo</th><th>Correo</th><th>Teléfono</th><th>Acciones</th></tr>
                                                    </thead>
                                                    <tbody>
                                                        {zoneData.recipients.map(item => (
                                                            <tr key={item.id}>
                                                                <td>{item.name}</td>
                                                                <td>{item.department || '-'}</td>
                                                                <td>{item.email || '-'}</td>
                                                                <td>{item.phone || '-'}</td>
                                                                <td style={{ width: '100px', textAlign: 'center' }}>
                                                                    <button className="btn" style={{ padding: '5px', color: 'var(--warning)', background: 'transparent' }} onClick={(e) => { e.stopPropagation(); openForm(item); }}><Edit size={18} /></button>
                                                                    <button className="btn" style={{ padding: '5px', color: 'var(--error)', background: 'transparent' }} onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}><Trash2 size={18} /></button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Sin zona asociada */}
                                    {group.withoutZone.length > 0 && (
                                        <div style={{ marginLeft: '10px' }}>
                                            {group.company.id !== 'unassigned' && (
                                                <h4 style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>Contactos Sin Zona Específica</h4>
                                            )}
                                            <div className="table-container">
                                                <table style={{ background: 'var(--card-bg)' }}>
                                                    <thead>
                                                        <tr><th>Nombre</th><th>Puesto/Depto Viejo</th><th>Correo</th><th>Teléfono</th><th>Acciones</th></tr>
                                                    </thead>
                                                    <tbody>
                                                        {group.withoutZone.map(item => (
                                                            <tr key={item.id}>
                                                                <td>{item.name}</td>
                                                                <td>{item.department || '-'}</td>
                                                                <td>{item.email || '-'}</td>
                                                                <td>{item.phone || '-'}</td>
                                                                <td style={{ width: '100px', textAlign: 'center' }}>
                                                                    <button className="btn" style={{ padding: '5px', color: 'var(--warning)', background: 'transparent' }} onClick={(e) => { e.stopPropagation(); openForm(item); }}><Edit size={18} /></button>
                                                                    <button className="btn" style={{ padding: '5px', color: 'var(--error)', background: 'transparent' }} onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}><Trash2 size={18} /></button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {hasItems === false && (
                                        <div style={{ padding: '10px', textAlign: 'center', color: 'var(--text-secondary)' }}>Esta empresa aún no tiene contactos.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{editId ? 'Editar' : 'Nuevo'} Destinatario / Contacto</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>Cerrar</button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleSubmit}>
                                <div style={{ border: '1px solid var(--border-color)', padding: '15px', borderRadius: '8px', marginBottom: '15px', background: 'rgba(79, 70, 229, 0.05)' }}>
                                    <div className="form-group">
                                        <label>Empresa / Cliente Asignado</label>
                                        <select 
                                            className="form-control" 
                                            value={formData.companyId} 
                                            onChange={e => {
                                                setFormData({ ...formData, companyId: e.target.value, zoneId: '' }); // Reset zone when company changes
                                            }}
                                        >
                                            <option value="">(Ninguna Empresa / Uso General)</option>
                                            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Zona / Departamento dentro de la Empresa</label>
                                        <select 
                                            className="form-control" 
                                            value={formData.zoneId} 
                                            onChange={e => setFormData({ ...formData, zoneId: e.target.value })}
                                            disabled={!formData.companyId}
                                        >
                                            <option value="">(Sin Zona Específica)</option>
                                            {availableZonesForm.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group"><label>Nombre del Contacto</label><input required className="form-control" type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                                <div className="form-group"><label>Cargo / Puesto Técnico</label><input className="form-control" type="text" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} placeholder="Ej. Gerente de Mantenimiento" /></div>
                                <div className="form-group"><label>Teléfono</label><input className="form-control" type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div>
                                <div className="form-group"><label>Correo</label><input className="form-control" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
                                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>Guardar Contacto</button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {editEntity && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3>Editar {editEntity.type === 'company' ? 'Empresa' : 'Departamento'}</h3>
                            <button className="modal-close" onClick={() => setEditEntity(null)}>Cerrar</button>
                        </div>
                        <div className="modal-body">
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '15px' }}>
                                Estás modificando el nombre de: <br/> <strong>{editEntity.originalName}</strong>
                            </p>
                            <div className="form-group">
                                <label>Nuevo Nombre</label>
                                <input 
                                    autoFocus
                                    className="form-control" 
                                    type="text" 
                                    value={editEntity.name} 
                                    onChange={(e) => setEditEntity({ ...editEntity, name: e.target.value })}
                                    onKeyDown={(e) => { if (e.key === 'Enter') saveEntityEdit(); }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={saveEntityEdit}>Guardar Cambios</button>
                                <button className="btn" style={{ flex: 1, justifyContent: 'center', background: '#e2e8f0' }} onClick={() => setEditEntity(null)}>Cancelar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default Recipients;
