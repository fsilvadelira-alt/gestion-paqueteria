import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { PackageOpen, CheckCircle, Truck, DollarSign, XCircle, FileText, FileX } from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [charts, setCharts] = useState(null);
    const [loading, setLoading] = useState(true);
    const [packagesList, setPackagesList] = useState([]);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const [{ data: statsData }, { data: chartsData }, { data: pkgsData }] = await Promise.all([
                    api.get('/dashboard/stats'),
                    api.get('/dashboard/charts'),
                    api.get('/packages')
                ]);
                setStats(statsData);
                setCharts(chartsData);
                setPackagesList(pkgsData);
            } catch (error) {
                console.error("Error fetching dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (loading) return <div>Cargando dashboard...</div>;

    const totalProviderPkgs = charts?.packagesByCarrier?.reduce((acc, curr) => acc + curr.totalPackages, 0) || 1;
    const labelsProviderPie = charts?.packagesByCarrier?.map(c => c.carrier?.name) || [];
    const dataProviderPie = charts?.packagesByCarrier?.map(c => ((c.totalPackages / totalProviderPkgs) * 100).toFixed(1)) || [];

    const providerPieData = {
        labels: labelsProviderPie.map((l, i) => `${l} (${dataProviderPie[i]}%)`),
        datasets: [{
            data: dataProviderPie,
            backgroundColor: ['rgba(245, 158, 11, 0.6)', 'rgba(79, 70, 229, 0.6)', 'rgba(16, 185, 129, 0.6)', 'rgba(239, 68, 68, 0.6)'],
            borderColor: ['#f59e0b', '#4f46e5', '#10b981', '#ef4444'],
            borderWidth: 1,
        }]
    };

    const totalLogisticsPkgs = charts?.packagesByLogistics?.reduce((acc, curr) => acc + curr.totalPackages, 0) || 1;
    const labelsLogisticsPie = charts?.packagesByLogistics?.map(l => l.logisticsCompany?.name || 'Desconocido') || [];
    const dataLogisticsPie = charts?.packagesByLogistics?.map(l => ((l.totalPackages / totalLogisticsPkgs) * 100).toFixed(1)) || [];

    const logisticsPieData = {
        labels: labelsLogisticsPie.map((l, i) => `${l} (${dataLogisticsPie[i]}%)`),
        datasets: [{
            data: dataLogisticsPie,
            backgroundColor: ['#6366f1', '#14b8a6', '#f43f5e', '#a855f7'],
            borderColor: ['#4f46e5', '#0d9488', '#e11d48', '#9333ea'],
            borderWidth: 1,
        }]
    };

    const labelsCarrier = charts?.expensesByCarrier?.map(c => c.carrier?.name) || [];
    const dataCarrier = charts?.expensesByCarrier?.map(c => c.totalCost) || [];

    const carrierBarData = {
        labels: labelsCarrier,
        datasets: [{
            label: 'Gastos por Proveedor ($)',
            data: dataCarrier,
            backgroundColor: 'rgba(79, 70, 229, 0.6)',
        }]
    };

    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const labelsTrend = charts?.monthlyTrend?.map(t => monthNames[parseInt(t.month) - 1]) || [];
    const dataTrend = charts?.monthlyTrend?.map(t => t.totalCost) || [];

    const trendLineData = {
        labels: labelsTrend,
        datasets: [{
            label: 'Gastos de compras por mes ($)',
            data: dataTrend,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            fill: true,
            tension: 0.4
        }]
    };

    // Unboxing Stats
    const pendingUnboxing = charts?.packagesByStatus?.find(s => s.status === 'Recibido')?.totalPackages || 0;
    const readyUnboxing = charts?.packagesByStatus?.find(s => s.status === 'Listo para entregar')?.totalPackages || 0;
    const incorrect = charts?.packagesByStatus?.find(s => s.status === 'Incorrecto')?.totalPackages || 0;
    const defective = charts?.packagesByStatus?.find(s => s.status === 'Defectuoso')?.totalPackages || 0;

    const unboxingPieData = {
        labels: ['Pendiente Unboxing', 'En buenas condiciones', 'Incorrecto', 'Defectuoso'],
        datasets: [{
            data: [pendingUnboxing, readyUnboxing, incorrect, defective],
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
            borderColor: ['#2563eb', '#059669', '#d97706', '#dc2626'],
            borderWidth: 1,
        }]
    };

    return (
        <div>
            <h1 className="title-row">Dashboard</h1>

            <div className="dash-grid">
                <div className="stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="stat-title">Compras en camino</span>
                        <Truck color="var(--warning)" />
                    </div>
                    <span className="stat-value">{stats?.totalEnCamino}</span>
                </div>
                <div className="stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="stat-title">Compras recibidas</span>
                        <PackageOpen color="var(--primary-color)" />
                    </div>
                    <span className="stat-value">{stats?.totalRecibidos}</span>
                </div>
                <div className="stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="stat-title">Compras entregadas</span>
                        <CheckCircle color="var(--success)" />
                    </div>
                    <span className="stat-value">{stats?.totalEntregados}</span>
                </div>
                <div className="stat-card" style={{ background: '#fef2f2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="stat-title" style={{ color: '#991b1b' }}>Por Regresar / Defectuosas</span>
                        <XCircle color="#ef4444" />
                    </div>
                    <span className="stat-value" style={{ color: '#7f1d1d' }}>{stats?.totalParaRegresar}</span>
                </div>

                <div className="stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="stat-title">Gastos Mensuales</span>
                        <DollarSign color="#3b82f6" />
                    </div>
                    <span className="stat-value">${(stats?.gastosMensuales || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="stat-title">Gastos Totales</span>
                        <DollarSign color="#8b5cf6" />
                    </div>
                    <span className="stat-value">${(stats?.gastosTotales || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="stat-title">Gastos Facturados</span>
                        <FileText color="#10b981" />
                    </div>
                    <span className="stat-value">${(stats?.gastosFacturados || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="stat-title">Gastos No Facturados</span>
                        <FileX color="#f59e0b" />
                    </div>
                    <span className="stat-value">${(stats?.gastosNoFacturados || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
            </div>

            {/* SECCIÓN SEMÁFORO (Debajo de indicadores, altura restringida) */}
            <div className="card" style={{ marginTop: '20px' }}>
                <h3 style={{ marginBottom: '15px' }}>Semáforo de Entregas (En camino)</h3>
                {/* Altura restrictiva para máximo ~10 registros (aprox 400px o 500px) */}
                <div className="table-container" style={{ maxHeight: '450px', overflowY: 'auto' }}>
                    <table>
                        <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                            <tr>
                                <th>Alerta</th>
                                <th>Descripción</th>
                                <th>Proveedor</th>
                                <th>Destino</th>
                                <th>Fecha de Llegada</th>
                            </tr>
                        </thead>
                        <tbody>
                            {packagesList.filter(p => p.status === 'En camino').map(p => {
                                const today = new Date();
                                today.setHours(0,0,0,0);
                                const arrival = new Date(p.arrivalDate);
                                arrival.setHours(0,0,0,0);
                                const diffTime = arrival - today;
                                const diffDays = isNaN(diffTime) ? 99 : Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                
                                let lightColor = '#22c55e'; // verde
                                let titleStr = `A tiempo (${diffDays} días restantes)`;
                                
                                if (diffDays <= 3 && diffDays > 0) {
                                    lightColor = '#facc15'; // amarillo
                                    titleStr = `Próximo a llegar (${diffDays} días restantes)`;
                                } else if (diffDays <= 0) {
                                    lightColor = '#ef4444'; // rojo
                                    titleStr = 'Día de entrega o Retrasado';
                                }

                                if (isNaN(diffTime) || !p.arrivalDate) {
                                    titleStr = 'Sin fecha definida';
                                    lightColor = '#94a3b8'; // gray
                                }

                                return (
                                    <tr key={p.id}>
                                        <td style={{ textAlign: 'center' }}>
                                            <div title={titleStr} style={{ 
                                                width: 15, height: 15, borderRadius: '50%', 
                                                backgroundColor: lightColor, display: 'inline-block',
                                                boxShadow: '0 0 5px rgba(0,0,0,0.2)'
                                            }}></div>
                                        </td>
                                        <td>{p.description ? (p.description.length > 50 ? p.description.substring(0,50)+'...' : p.description) : (p.trackingNumber || '-')}</td>
                                        <td>{p.carrier?.name}</td>
                                        <td>{p.finalRecipient?.name}</td>
                                        <td>{p.arrivalDate ? new Date(p.arrivalDate).toISOString().split('T')[0] : 'Sin fecha'}</td>
                                    </tr>
                                );
                            })}
                            {packagesList.filter(p => p.status === 'En camino').length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No hay compras en camino actualmente.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* SECCIÓN GRÁFICAS MEDIAS (3 en una fila) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
                <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ marginBottom: '15px', flexShrink: 0 }}>Estados de Unboxing</h3>
                    <div style={{ height: '300px', display: 'flex', justifyContent: 'center', flexGrow: 1 }}>
                        <Pie data={unboxingPieData} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ marginBottom: '15px', flexShrink: 0 }}>Uso de Proveedor</h3>
                    <div style={{ height: '300px', display: 'flex', justifyContent: 'center', flexGrow: 1 }}>
                        <Pie data={providerPieData} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ marginBottom: '15px', flexShrink: 0 }}>Uso de Paqueterías (%)</h3>
                    <div style={{ height: '300px', display: 'flex', justifyContent: 'center', flexGrow: 1 }}>
                        <Pie data={logisticsPieData} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>
            </div>

            {/* SECCIÓN INFERIOR (Footer Dashboard) */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '20px' }}>
                <div className="card dash-chart-card">
                    <h3 style={{ marginBottom: '15px' }}>Gastos por Proveedor (Mes)</h3>
                    <div style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
                        <Bar data={carrierBarData} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>
                <div className="card dash-chart-card">
                    <h3 style={{ marginBottom: '15px' }}>Tendencia Anual de Gastos de Compras</h3>
                    <div style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
                        <Line data={trendLineData} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
