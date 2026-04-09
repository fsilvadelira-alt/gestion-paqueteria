import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Package, Truck, Users, Activity, FileText, Database, Settings, LogOut, Trophy, Archive, DollarSign, FolderOpen } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Sidebar = ({ isOpen, setIsOpen }) => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
                <div className="logo-container">
                    <img src="/logo.png" alt="ICAUTOMATION" className="sidebar-logo" />
                </div>
            </div>
            <ul className="nav-links">
                {user?.role === 'Admin' && (
                    <li onClick={() => setIsOpen && setIsOpen(false)}>
                        <NavLink to="/" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                            <Activity size={20} /> Dashboard
                        </NavLink>
                    </li>
                )}
                <li onClick={() => setIsOpen && setIsOpen(false)}>
                    <NavLink to="/packages" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                        <Package size={20} /> Compras
                    </NavLink>
                </li>
                <li onClick={() => setIsOpen && setIsOpen(false)}>
                    <NavLink to="/carriers" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                        <Truck size={20} /> Proveedores
                    </NavLink>
                </li>
                <li onClick={() => setIsOpen && setIsOpen(false)}>
                    <NavLink to="/logistics" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                        <Package size={20} /> Paqueterías
                    </NavLink>
                </li>
                <li onClick={() => setIsOpen && setIsOpen(false)}>
                    <NavLink to="/recipients" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                        <Users size={20} /> Destinatarios
                    </NavLink>
                </li>
                {user?.role === 'Admin' && (
                    <li onClick={() => setIsOpen && setIsOpen(false)}>
                        <NavLink to="/quotes" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                            <FileText size={20} /> Cotizaciones
                        </NavLink>
                    </li>
                )}
                {user?.role === 'Admin' && (
                    <li onClick={() => setIsOpen && setIsOpen(false)}>
                        <NavLink to="/services" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                            <Trophy size={20} /> Servicios Generales
                        </NavLink>
                    </li>
                )}
                {user?.role === 'Admin' && (
                    <li onClick={() => setIsOpen && setIsOpen(false)}>
                        <NavLink to="/history" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                            <Archive size={20} /> Histórico de compras
                        </NavLink>
                    </li>
                )}
                {user?.role === 'Admin' && (
                    <li onClick={() => setIsOpen && setIsOpen(false)}>
                        <NavLink to="/quote-history" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                            <FolderOpen size={20} /> Histórico de cotizaciones
                        </NavLink>
                    </li>
                )}
                {user?.role === 'Admin' && (
                    <li onClick={() => setIsOpen && setIsOpen(false)}>
                        <NavLink to="/operational-expenses" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                            <DollarSign size={20} /> Gastos operativos
                        </NavLink>
                    </li>
                )}
                {user?.role === 'Admin' && (
                    <li onClick={() => setIsOpen && setIsOpen(false)}>
                        <NavLink to="/expenses" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                            <Database size={20} /> Caja Chica
                        </NavLink>
                    </li>
                )}
                {user?.role === 'Admin' && (
                    <li onClick={() => setIsOpen && setIsOpen(false)}>
                        <NavLink to="/users" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                            <Settings size={20} /> Usuarios
                        </NavLink>
                    </li>
                )}
            </ul>
            <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)' }}>
                <button className="logout-btn" onClick={handleLogout}>
                    <LogOut size={20} /> Cerrar Sesión
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
