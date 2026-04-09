import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { UserCircle, Menu } from 'lucide-react';

const Header = ({ setSidebarOpen }) => {
    const { user } = useContext(AuthContext);

    return (
        <div className="header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <button className="mobile-menu-btn" onClick={() => setSidebarOpen && setSidebarOpen(true)}>
                    <Menu size={24} />
                </button>
                <div style={{ fontWeight: 'bold' }}>Panel de Control</div>
            </div>
            <div className="user-info">
                <UserCircle size={24} />
                <span>{user?.name} ({user?.role})</span>
            </div>
        </div>
    );
};

export default Header;
