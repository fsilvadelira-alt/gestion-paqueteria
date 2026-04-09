import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FolderOpen, Archive, CheckCircle, FileText } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import * as XLSX from 'xlsx';

const QuoteHistory = () => {
    const { user: currentUser } = React.useContext(AuthContext);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.get('/quotes/history');
                setHistory(res.data);
            } catch (error) {
                console.error('Error fetching quote history', error);
            }
        };
        fetchHistory();
    }, []);

    const calculateTotals = (q) => {
        if (!q.wonQuote) return { purchases: 0, expenses: 0, totalCost: 0, profit: 0 };
        
        const purchases = (q.wonQuote.linkedPackages || []).reduce((sum, pkg) => sum + (parseFloat(pkg.amountMXN) || 0), 0);
        const expenses = (q.wonQuote.operationalExpenses || []).reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
        const totalCost = purchases + expenses;
        const profit = parseFloat(q.cost || 0) - totalCost;
        
        return { purchases, expenses, totalCost, profit };
    };

    const exportToExcel = () => {
        const data = history.map(q => {
            const totals = calculateTotals(q);
            const isClosed = q.status === 'Cerrado';
            
            return {
                'Folio': q.folio || 'S/F',
                'Cliente': `${q.recipient?.company?.name || 'Local'} - ${q.recipient?.name || 'Sin contacto'}`,
                'Descripción': q.description || '',
                'Categoría': q.wonQuote?.category || '---',
                'Coste': parseFloat(q.cost || 0),
                'Total compras internas': totals.purchases,
                'Total gastos operativos': totals.expenses,
                'Ganancia final': totals.profit,
                'Estado final': q.status,
                'Fecha de cierre o fecha de pérdida': new Date(q.updatedAt).toLocaleDateString()
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Histórico');
        XLSX.writeFile(workbook, 'Reporte_Historico_Cotizaciones.xlsx');
    };

    return (
        <div className="quotes-module">
            <div className="title-row" style={{ marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FolderOpen size={24} style={{ marginRight: '10px' }} /> Histórico de Cotizaciones
                </h2>
                {currentUser?.role === 'Admin' && (
                    <button className="btn btn-primary" onClick={exportToExcel} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <FileText size={16} /> Exportar histórico a Excel
                    </button>
                )}
            </div>
            
            <div className="card table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Folio / F. Solicitud</th>
                            <th>Cliente</th>
                            <th>Descripción</th>
                            <th>Coste Cotizado</th>
                            <th>Categoría</th>
                            <th>Estado Final</th>
                            <th>Totales Financieros</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map(q => {
                            const totals = calculateTotals(q);
                            const isClosed = q.status === 'Cerrado';
                            const isLost = q.status === 'Perdido';
                            
                            return (
                                <tr key={q.id}>
                                    <td>
                                        <strong>{q.folio || 'S/F'}</strong><br/>
                                        <small>{new Date(q.requestDate).toLocaleDateString()}</small>
                                    </td>
                                    <td>
                                        <strong>{q.recipient?.company?.name || 'Local'}</strong><br/>
                                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{q.recipient?.name}</span>
                                    </td>
                                    <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={q.description}>
                                        {q.description}
                                    </td>
                                    <td style={{ fontWeight: 'bold' }}>
                                        ${parseFloat(q.cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td>
                                        {q.wonQuote?.category ? (
                                            <span style={{ background: '#f3f4f6', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                                                {q.wonQuote.category}
                                            </span>
                                        ) : '---'}
                                    </td>
                                    <td>
                                        {isClosed && (
                                            <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                                                <CheckCircle size={14} /> Cerrado
                                            </span>
                                        )}
                                        {isLost && (
                                            <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                                                <Archive size={14} /> Perdido
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        {isClosed ? (
                                            <div style={{ fontSize: '12px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}>
                                                    <span>Compras:</span> <span>${totals.purchases.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f59e0b', marginBottom: '2px' }}>
                                                    <span>Gastos Op:</span> <span>${totals.expenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px solid var(--border-color)', paddingTop: '2px', color: totals.profit >= 0 ? '#10b981' : '#ef4444' }}>
                                                    <span>Ganancia:</span> <span>${totals.profit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{q.lostReason || 'Sin motivo'}</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        {history.length === 0 && (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                                    No hay cotizaciones en el histórico.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default QuoteHistory;
