import React, { useContext, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Packages from './pages/Packages';
import Carriers from './pages/Carriers';
import Recipients from './pages/Recipients';
import Expenses from './pages/Expenses';
import Users from './pages/Users';
import History from './pages/History';
import Logistics from './pages/Logistics';
import Quotes from './pages/Quotes';
import GeneralServices from './pages/GeneralServices';

import QuoteHistory from './pages/QuoteHistory';
import OperationalExpenses from './pages/OperationalExpenses';

const Layout = ({ children, sidebarOpen, setSidebarOpen }) => (
    <div className="app-container">
        {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className="main-content">
            <Header setSidebarOpen={setSidebarOpen} />
            <div className="page-container">
                {children}
            </div>
        </div>
    </div>
);

function App() {
    const { user } = useContext(AuthContext);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <>
            <Routes>
                <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
                <Route path="/" element={
                    user ? (user.role === 'Admin' ? <Layout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}><Dashboard /></Layout> : <Navigate to="/packages" />) : <Navigate to="/login" />
                } />
                <Route path="/packages" element={user ? <Layout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}><Packages /></Layout> : <Navigate to="/login" />} />
                <Route path="/carriers" element={user ? <Layout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}><Carriers /></Layout> : <Navigate to="/login" />} />
                <Route path="/logistics" element={user ? <Layout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}><Logistics /></Layout> : <Navigate to="/login" />} />
                <Route path="/recipients" element={user ? <Layout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}><Recipients /></Layout> : <Navigate to="/login" />} />
                <Route path="/quotes" element={user?.role === 'Admin' ? <Layout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}><Quotes /></Layout> : <Navigate to="/" />} />
                <Route path="/quote-history" element={user?.role === 'Admin' ? <Layout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}><QuoteHistory /></Layout> : <Navigate to="/" />} />
                <Route path="/services" element={user?.role === 'Admin' ? <Layout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}><GeneralServices /></Layout> : <Navigate to="/" />} />
                <Route path="/history" element={user?.role === 'Admin' ? <Layout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}><History /></Layout> : <Navigate to="/" />} />
                <Route path="/expenses" element={
                    user?.role === 'Admin' ? <Layout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}><Expenses /></Layout> : <Navigate to="/" />
                } />
                <Route path="/operational-expenses" element={user?.role === 'Admin' ? <Layout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}><OperationalExpenses /></Layout> : <Navigate to="/" />} />
                <Route path="/users" element={user?.role === 'Admin' ? <Layout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}><Users /></Layout> : <Navigate to="/" />} />
            </Routes>
            <footer className="global-footer">
                &copy; 2026 ICAUTOMATION - Todos los derechos reservados. Mantenimiento Integral de Sistemas Industriales.
            </footer>
        </>
    );
}

export default App;
