import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User } from '../../services/api';
import { notificationApi } from '../../services/api';
import { Bell, Moon, Sun, LogOut, Search } from 'lucide-react';
import './Header.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface HeaderProps {
    user: User | null;
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, theme, onToggleTheme, onLogout }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [showUserMenu, setShowUserMenu] = useState(false);

    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    const fetchUnreadCount = async () => {
        try {
            const response = await notificationApi.getUnreadCount();
            if (response.data.success && response.data.data) {
                setUnreadCount(response.data.data.unreadCount);
            }
        } catch (error) {
            // Ignore
        }
    };

    return (
        <header className="header">
            <div className="header-left">
                <div className="search-bar">
                    <Search size={18} className="search-icon" />
                    <input type="text" placeholder="Search..." />
                </div>
            </div>

            <div className="header-right">
                <button className="header-btn" onClick={onToggleTheme} title="Toggle theme">
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>

                <Link to="/notifications" className="header-btn notification-btn">
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span className="notification-badge">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Link>

                <div className="user-menu-container">
                    <button
                        className="user-menu-trigger"
                        onClick={() => setShowUserMenu(!showUserMenu)}
                    >
                        <div className="header-avatar">
                            {user?.profile?.avatarUrl ? (
                                <img src={`${API_BASE_URL}${user.profile.avatarUrl}`} alt={user.name} />
                            ) : (
                                <span>{user?.name?.charAt(0).toUpperCase()}</span>
                            )}
                        </div>
                    </button>

                    {showUserMenu && (
                        <div className="user-menu">
                            <div className="user-menu-header">
                                <span className="user-menu-name">{user?.name}</span>
                                <span className="user-menu-email">{user?.email}</span>
                            </div>
                            <div className="user-menu-divider" />
                            <Link to="/profile" className="user-menu-item" onClick={() => setShowUserMenu(false)}>
                                Profile
                            </Link>
                            <Link to="/change-password" className="user-menu-item" onClick={() => setShowUserMenu(false)}>
                                Change Password
                            </Link>
                            <div className="user-menu-divider" />
                            <button className="user-menu-item logout" onClick={onLogout}>
                                <LogOut size={16} />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
