import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminApi, notificationApi, ticketApi } from '../../services/api';
import {
    Users,
    UserCheck,
    UserPlus,
    Shield,
    Award,
    Clock,
    CheckCircle,
    AlertCircle,
    TrendingUp,
    Bell,
    RefreshCw,
    ArrowRight,
    Activity,
    FileText,
    Settings,
    Loader2,
    LayoutDashboard,
    ClipboardList,
    HelpCircle,
    ChevronRight,
    Eye,
    UserX,
    Briefcase,
    BarChart3,
    Star,
    Zap,
    MessageSquare,
    Calendar
} from 'lucide-react';
import './AdminDashboard.css';

interface PortalStats {
    totalUsers: number;
    admins: number;
    analysts: number;
    experts: number;
    customers: number;
    activeUsers: number;
    pendingUsers: number;
    recentUsers: any[];
}

interface TicketSummary {
    total: number;
    open: number;
    inProgress: number;
    closed: number;
}

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    created_at: string;
    is_read: boolean;
}

const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [portalStats, setPortalStats] = useState<PortalStats | null>(null);
    const [ticketSummary, setTicketSummary] = useState<TicketSummary>({ total: 0, open: 0, inProgress: 0, closed: 0 });
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const isSuperAdmin = user?.role === 'SUPERADMIN';

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [statsRes, ticketRes, notifRes, notifCountRes] = await Promise.all([
                adminApi.getStats().catch(() => ({ data: { success: false, data: null } })),
                ticketApi.getStats().catch(() => ({ data: { success: false, data: null } })),
                notificationApi.getNotifications({ limit: 5 }).catch(() => ({ data: { success: false, data: null } })),
                notificationApi.getUnreadCount().catch(() => ({ data: { success: false, data: null } }))
            ]);

            if (statsRes.data.success && statsRes.data.data) {
                setPortalStats(statsRes.data.data);
            }

            if (ticketRes.data.success && ticketRes.data.data?.summary) {
                const summary = ticketRes.data.data.summary;
                setTicketSummary({
                    total: summary.total || 0,
                    open: summary.open || 0,
                    inProgress: summary.inProgress || 0,
                    closed: summary.closed || 0
                });
            }

            if (notifRes.data.success) {
                setNotifications(notifRes.data.data?.notifications || []);
            }

            if (notifCountRes.data.success) {
                setUnreadCount(notifCountRes.data.data?.unreadCount || 0);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchDashboardData();
        setRefreshing(false);
    };

    const getWelcomeMessage = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getRoleBadgeClass = (role: string) => {
        switch (role?.toLowerCase()) {
            case 'superadmin': return 'role-superadmin';
            case 'admin': return 'role-admin';
            case 'expert': return 'role-expert';
            case 'analyst': return 'role-analyst';
            default: return 'role-customer';
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'active': return 'status-active';
            case 'suspended': return 'status-suspended';
            case 'inactive': return 'status-inactive';
            default: return 'status-pending';
        }
    };

    // Navigation shortcuts for admin
    const adminShortcuts = [
        { 
            title: 'User Management', 
            description: 'Manage all platform users',
            icon: Users, 
            path: '/admin/users', 
            color: 'primary',
            stat: portalStats?.totalUsers || 0,
            statLabel: 'Total Users'
        },
        { 
            title: 'Expert Applications', 
            description: 'Review pending applications',
            icon: Award, 
            path: '/admin/expert-review', 
            color: 'warning',
            stat: portalStats?.pendingUsers || 0,
            statLabel: 'Pending'
        },
        { 
            title: 'Task Assignment', 
            description: 'Assign and track tasks',
            icon: ClipboardList, 
            path: '/admin/task-assignment', 
            color: 'info',
            stat: null,
            statLabel: 'Manage'
        },
        { 
            title: 'Help Desk', 
            description: 'Support tickets & requests',
            icon: HelpCircle, 
            path: '/help-desk', 
            color: 'success',
            stat: ticketSummary.open,
            statLabel: 'Open Tickets'
        },
        { 
            title: 'Reports & Analytics', 
            description: 'View platform insights',
            icon: BarChart3, 
            path: '/admin/reports', 
            color: 'accent',
            stat: null,
            statLabel: 'View'
        },
        { 
            title: 'Ticket Management', 
            description: 'Manage support tickets',
            icon: MessageSquare, 
            path: '/admin/tickets', 
            color: 'purple',
            stat: ticketSummary.total,
            statLabel: 'Total'
        }
    ];

    // SuperAdmin extra shortcuts
    const superAdminShortcuts = [
        { 
            title: 'Admin Management', 
            description: 'Manage admin accounts',
            icon: Shield, 
            path: '/superadmin/admins', 
            color: 'danger',
            stat: portalStats?.admins || 0,
            statLabel: 'Admins'
        },
        { 
            title: 'System Logs', 
            description: 'View activity logs',
            icon: FileText, 
            path: '/superadmin/logs', 
            color: 'secondary',
            stat: null,
            statLabel: 'View'
        },
        { 
            title: 'Global Config', 
            description: 'Platform settings',
            icon: Settings, 
            path: '/superadmin/config', 
            color: 'tertiary',
            stat: null,
            statLabel: 'Configure'
        }
    ];

    const shortcuts = isSuperAdmin 
        ? [...adminShortcuts, ...superAdminShortcuts] 
        : adminShortcuts;

    if (loading) {
        return (
            <div className="admin-dashboard-loading">
                <Loader2 className="spinner" size={40} />
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="admin-dashboard portal-overview">
            {/* Header */}
            <div className="dashboard-header">
                <div className="header-content">
                    <div className="welcome-section">
                        <div className="welcome-icon">
                            <LayoutDashboard size={28} />
                        </div>
                        <div className="welcome-text">
                            <h1>{getWelcomeMessage()}, {user?.name}!</h1>
                            <p className="subtitle">
                                {isSuperAdmin 
                                    ? 'Complete system overview and management controls' 
                                    : 'Manage users, applications, and support requests'}
                            </p>
                        </div>
                    </div>
                    <div className="header-actions">
                        <button 
                            className="btn-refresh"
                            onClick={handleRefresh}
                            disabled={refreshing}
                            title="Refresh data"
                        >
                            <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
                        </button>
                        <Link to="/notifications" className="btn-notifications">
                            <Bell size={20} />
                            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
                        </Link>
                    </div>
                </div>
            </div>

            {/* Overview Stats */}
            <div className="overview-stats">
                <div className="stat-card highlight">
                    <div className="stat-icon-wrapper primary">
                        <Users size={24} />
                    </div>
                    <div className="stat-details">
                        <span className="stat-number">{portalStats?.totalUsers || 0}</span>
                        <span className="stat-title">Total Users</span>
                    </div>
                    <Link to="/admin/users" className="stat-link">
                        <Eye size={16} />
                    </Link>
                </div>

                <div className="stat-card">
                    <div className="stat-icon-wrapper success">
                        <UserCheck size={24} />
                    </div>
                    <div className="stat-details">
                        <span className="stat-number">{portalStats?.activeUsers || 0}</span>
                        <span className="stat-title">Active Users</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon-wrapper warning">
                        <Award size={24} />
                    </div>
                    <div className="stat-details">
                        <span className="stat-number">{portalStats?.experts || 0}</span>
                        <span className="stat-title">Experts</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon-wrapper info">
                        <Briefcase size={24} />
                    </div>
                    <div className="stat-details">
                        <span className="stat-number">{portalStats?.customers || 0}</span>
                        <span className="stat-title">Customers</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon-wrapper accent">
                        <Clock size={24} />
                    </div>
                    <div className="stat-details">
                        <span className="stat-number">{portalStats?.pendingUsers || 0}</span>
                        <span className="stat-title">Pending</span>
                    </div>
                </div>

                {isSuperAdmin && (
                    <div className="stat-card">
                        <div className="stat-icon-wrapper danger">
                            <Shield size={24} />
                        </div>
                        <div className="stat-details">
                            <span className="stat-number">{portalStats?.admins || 0}</span>
                            <span className="stat-title">Admins</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Navigation */}
            <section className="section">
                <div className="section-header">
                    <h2>
                        <Zap size={20} />
                        Quick Navigation
                    </h2>
                    <p className="section-subtitle">Access all portal sections</p>
                </div>
                <div className="shortcuts-grid">
                    {shortcuts.map((shortcut, index) => {
                        const IconComponent = shortcut.icon;
                        return (
                            <Link 
                                key={index} 
                                to={shortcut.path} 
                                className={`shortcut-card ${shortcut.color}`}
                            >
                                <div className="shortcut-header">
                                    <div className="shortcut-icon">
                                        <IconComponent size={24} />
                                    </div>
                                    {shortcut.stat !== null && (
                                        <div className="shortcut-stat">
                                            <span className="stat-value">{shortcut.stat}</span>
                                            <span className="stat-label">{shortcut.statLabel}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="shortcut-content">
                                    <h3>{shortcut.title}</h3>
                                    <p>{shortcut.description}</p>
                                </div>
                                <div className="shortcut-arrow">
                                    <ChevronRight size={18} />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </section>

            {/* Bottom Grid: Recent Users & Notifications */}
            <div className="bottom-grid">
                {/* Recent Users */}
                <div className="panel users-panel">
                    <div className="panel-header">
                        <h3>
                            <UserPlus size={18} />
                            Recently Joined Users
                        </h3>
                        <Link to="/admin/users" className="btn-view-all">
                            View All <ArrowRight size={14} />
                        </Link>
                    </div>
                    <div className="users-list">
                        {portalStats?.recentUsers && portalStats.recentUsers.length > 0 ? (
                            portalStats.recentUsers.slice(0, 5).map((u) => (
                                <div key={u.id} className="user-item">
                                    <div className="user-avatar">
                                        {u.name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <div className="user-info">
                                        <span className="user-name">{u.name}</span>
                                        <span className="user-email">{u.email}</span>
                                    </div>
                                    <div className="user-meta">
                                        <span className={`role-badge ${getRoleBadgeClass(u.role)}`}>
                                            {u.role}
                                        </span>
                                        <span className="user-time">{formatDate(u.created_at)}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">
                                <Users size={32} />
                                <p>No recent users</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Ticket Summary */}
                <div className="panel summary-panel">
                    <div className="panel-header">
                        <h3>
                            <HelpCircle size={18} />
                            Support Overview
                        </h3>
                        <Link to="/help-desk" className="btn-view-all">
                            Open Help Desk <ArrowRight size={14} />
                        </Link>
                    </div>
                    <div className="summary-stats">
                        <div className="summary-item">
                            <div className="summary-icon total">
                                <MessageSquare size={20} />
                            </div>
                            <div className="summary-details">
                                <span className="summary-value">{ticketSummary.total}</span>
                                <span className="summary-label">Total Tickets</span>
                            </div>
                        </div>
                        <div className="summary-item">
                            <div className="summary-icon open">
                                <AlertCircle size={20} />
                            </div>
                            <div className="summary-details">
                                <span className="summary-value">{ticketSummary.open}</span>
                                <span className="summary-label">Open</span>
                            </div>
                        </div>
                        <div className="summary-item">
                            <div className="summary-icon progress">
                                <Activity size={20} />
                            </div>
                            <div className="summary-details">
                                <span className="summary-value">{ticketSummary.inProgress}</span>
                                <span className="summary-label">In Progress</span>
                            </div>
                        </div>
                        <div className="summary-item">
                            <div className="summary-icon closed">
                                <CheckCircle size={20} />
                            </div>
                            <div className="summary-details">
                                <span className="summary-value">{ticketSummary.closed}</span>
                                <span className="summary-label">Closed</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="panel notifications-panel">
                    <div className="panel-header">
                        <h3>
                            <Bell size={18} />
                            Notifications
                            {unreadCount > 0 && <span className="count-badge">{unreadCount}</span>}
                        </h3>
                        <Link to="/notifications" className="btn-view-all">
                            View All <ArrowRight size={14} />
                        </Link>
                    </div>
                    <div className="notifications-list">
                        {notifications.length > 0 ? (
                            notifications.map(notif => (
                                <div 
                                    key={notif.id} 
                                    className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
                                >
                                    <div className="notif-icon">
                                        {notif.type === 'ticket' ? <MessageSquare size={16} /> : 
                                         notif.type === 'alert' ? <AlertCircle size={16} /> : 
                                         notif.type === 'user' ? <UserPlus size={16} /> :
                                         <Bell size={16} />}
                                    </div>
                                    <div className="notif-content">
                                        <span className="notif-title">{notif.title}</span>
                                        <span className="notif-message">{notif.message}</span>
                                    </div>
                                    <span className="notif-time">{formatDate(notif.created_at)}</span>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">
                                <Bell size={32} />
                                <p>No notifications</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Role Distribution (SuperAdmin) */}
                {isSuperAdmin && portalStats && (
                    <div className="panel distribution-panel">
                        <div className="panel-header">
                            <h3>
                                <Star size={18} />
                                User Distribution
                            </h3>
                        </div>
                        <div className="distribution-list">
                            <div className="distribution-item">
                                <div className="dist-label">
                                    <span className="dist-dot admin"></span>
                                    Admins
                                </div>
                                <div className="dist-bar-container">
                                    <div 
                                        className="dist-bar admin" 
                                        style={{ width: `${portalStats.totalUsers ? (portalStats.admins / portalStats.totalUsers) * 100 : 0}%` }}
                                    ></div>
                                </div>
                                <span className="dist-count">{portalStats.admins}</span>
                            </div>
                            <div className="distribution-item">
                                <div className="dist-label">
                                    <span className="dist-dot analyst"></span>
                                    Analysts
                                </div>
                                <div className="dist-bar-container">
                                    <div 
                                        className="dist-bar analyst" 
                                        style={{ width: `${portalStats.totalUsers ? (portalStats.analysts / portalStats.totalUsers) * 100 : 0}%` }}
                                    ></div>
                                </div>
                                <span className="dist-count">{portalStats.analysts}</span>
                            </div>
                            <div className="distribution-item">
                                <div className="dist-label">
                                    <span className="dist-dot expert"></span>
                                    Experts
                                </div>
                                <div className="dist-bar-container">
                                    <div 
                                        className="dist-bar expert" 
                                        style={{ width: `${portalStats.totalUsers ? (portalStats.experts / portalStats.totalUsers) * 100 : 0}%` }}
                                    ></div>
                                </div>
                                <span className="dist-count">{portalStats.experts}</span>
                            </div>
                            <div className="distribution-item">
                                <div className="dist-label">
                                    <span className="dist-dot customer"></span>
                                    Customers
                                </div>
                                <div className="dist-bar-container">
                                    <div 
                                        className="dist-bar customer" 
                                        style={{ width: `${portalStats.totalUsers ? (portalStats.customers / portalStats.totalUsers) * 100 : 0}%` }}
                                    ></div>
                                </div>
                                <span className="dist-count">{portalStats.customers}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
