import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { User } from '../../services/api';
import {
    LayoutDashboard,
    User as UserIcon,
    Bell,
    HelpCircle,
    FileText,
    ClipboardList,
    Briefcase,
    Wallet,
    Award,
    FolderOpen,
    Users,
    CheckCircle,
    BarChart3,
    Settings,
    Shield,
    ChevronLeft,
    ChevronRight,
    LogOut,
} from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
    user: User | null;
    collapsed: boolean;
    onToggle: () => void;
    onLogout?: () => void;
}

interface MenuItem {
    label: string;
    icon: React.ReactNode;
    path: string;
    roles: string[];
}

const menuItems: MenuItem[] = [
    // Common
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard', roles: ['CUSTOMER'] },
    { label: 'Profile', icon: <UserIcon size={20} />, path: '/profile', roles: ['CUSTOMER', 'EXPERT', 'ANALYST', 'ADMIN', 'SUPERADMIN'] },
    { label: 'Notifications', icon: <Bell size={20} />, path: '/notifications', roles: ['CUSTOMER', 'EXPERT', 'ANALYST', 'ADMIN', 'SUPERADMIN'] },
    { label: 'Help Desk', icon: <HelpCircle size={20} />, path: '/help-desk', roles: ['CUSTOMER', 'EXPERT', 'ANALYST', 'ADMIN', 'SUPERADMIN'] },

    // Customer
    { label: 'Apply as Expert', icon: <FileText size={20} />, path: '/customer/apply-expert', roles: ['CUSTOMER'] },
    { label: 'Application Status', icon: <ClipboardList size={20} />, path: '/customer/application-status', roles: ['CUSTOMER'] },

    // Expert
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/expert/dashboard', roles: ['EXPERT'] },
    { label: 'Portfolio', icon: <FolderOpen size={20} />, path: '/expert/portfolio', roles: ['EXPERT'] },
    { label: 'Certifications', icon: <Award size={20} />, path: '/expert/certifications', roles: ['EXPERT'] },
    { label: 'Tasks', icon: <Briefcase size={20} />, path: '/expert/tasks', roles: ['EXPERT'] },
    { label: 'Earnings', icon: <Wallet size={20} />, path: '/expert/earnings', roles: ['EXPERT'] },

    // Analyst
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/analyst/dashboard', roles: ['ANALYST'] },
    { label: 'Verification', icon: <CheckCircle size={20} />, path: '/analyst/verification', roles: ['ANALYST'] },

    // Admin
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/admin/dashboard', roles: ['ADMIN'] },
    { label: 'Users', icon: <Users size={20} />, path: '/admin/users', roles: ['ADMIN', 'SUPERADMIN'] },
    { label: 'Expert Review', icon: <CheckCircle size={20} />, path: '/admin/expert-review', roles: ['ADMIN', 'SUPERADMIN'] },
    { label: 'Task Assignment', icon: <Briefcase size={20} />, path: '/admin/task-assignment', roles: ['ADMIN', 'SUPERADMIN'] },
    { label: 'Reports', icon: <BarChart3 size={20} />, path: '/admin/reports', roles: ['ADMIN', 'SUPERADMIN'] },

    // SuperAdmin
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/superadmin/dashboard', roles: ['SUPERADMIN'] },
    { label: 'Admin Management', icon: <Shield size={20} />, path: '/superadmin/admins', roles: ['SUPERADMIN'] },
    { label: 'Configuration', icon: <Settings size={20} />, path: '/superadmin/config', roles: ['SUPERADMIN'] },
    { label: 'System Logs', icon: <FileText size={20} />, path: '/superadmin/logs', roles: ['SUPERADMIN'] },
];

const Sidebar: React.FC<SidebarProps> = ({ user, collapsed, onToggle, onLogout }) => {
    const location = useLocation();

    const filteredItems = menuItems.filter(item =>
        user && item.roles.includes(user.role)
    );

    const getRoleBadgeClass = (role: string) => {
        const classes: Record<string, string> = {
            CUSTOMER: 'badge-customer',
            EXPERT: 'badge-expert',
            ANALYST: 'badge-analyst',
            ADMIN: 'badge-admin',
            SUPERADMIN: 'badge-superadmin',
        };
        return classes[role] || '';
    };

    const handleLogout = () => {
        if (onLogout) {
            onLogout();
        }
    };

    return (
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <div className="logo">
                    {!collapsed && <span className="logo-text">ProVeloce</span>}
                    {collapsed && <span className="logo-icon">PV</span>}
                </div>
                <button className="collapse-btn" onClick={onToggle}>
                    {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>

            {!collapsed && user && (
                <div className="sidebar-user">
                    <div className="user-avatar">
                        {user.profile?.avatarUrl ? (
                            <img
                                src={user.profile.avatarUrl}
                                alt={user.name}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    const fallback = document.createElement('span');
                                    fallback.textContent = user.name.charAt(0).toUpperCase();
                                    (e.target as HTMLImageElement).parentElement?.appendChild(fallback);
                                }}
                            />
                        ) : (
                            <span>{user.name.charAt(0).toUpperCase()}</span>
                        )}
                    </div>
                    <div className="user-info">
                        <span className="user-name">{user.name}</span>
                        <span className={`user-role ${getRoleBadgeClass(user.role)}`}>
                            {user.role}
                        </span>
                    </div>
                </div>
            )}

            <nav className="sidebar-nav">
                {filteredItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `nav-item ${isActive ? 'active' : ''}`
                        }
                        title={collapsed ? item.label : undefined}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        {!collapsed && <span className="nav-label">{item.label}</span>}
                    </NavLink>
                ))}
            </nav>

            <div className={`sidebar-footer ${collapsed ? 'footer-collapsed' : 'footer-expanded'}`}>
                {collapsed ? (
                    // Collapsed: Settings on top, Logout below
                    <>
                        <NavLink to="/change-password" className="nav-item" title="Settings">
                            <span className="nav-icon"><Settings size={20} /></span>
                        </NavLink>
                        <button
                            className="nav-item logout-btn"
                            onClick={handleLogout}
                            title="Logout"
                        >
                            <span className="nav-icon"><LogOut size={20} /></span>
                        </button>
                    </>
                ) : (
                    // Expanded: Settings on left, Logout on right (side by side)
                    <div className="footer-row">
                        <NavLink to="/change-password" className="nav-item footer-item">
                            <span className="nav-icon"><Settings size={20} /></span>
                            <span className="nav-label">Settings</span>
                        </NavLink>
                        <button
                            className="nav-item footer-item logout-btn"
                            onClick={handleLogout}
                        >
                            <span className="nav-icon"><LogOut size={20} /></span>
                            <span className="nav-label">Logout</span>
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;

