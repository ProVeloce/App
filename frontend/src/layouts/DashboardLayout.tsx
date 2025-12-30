import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSession } from '../context/SessionContext';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import './DashboardLayout.css';

const DashboardLayout: React.FC = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { sessionId } = useSession();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className={`dashboard-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            <Sidebar
                user={user}
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                onLogout={handleLogout}
            />
            <div className="dashboard-main">
                <Header
                    user={user}
                    theme={theme}
                    onToggleTheme={toggleTheme}
                    onLogout={handleLogout}
                />
                <main className="dashboard-content">
                    <Outlet />
                </main>
                {sessionId && (
                    <footer className="dashboard-footer">
                        <span className="session-id">Session ID: {sessionId}</span>
                    </footer>
                )}
            </div>
        </div>
    );
};

export default DashboardLayout;
