import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminApi, notificationApi, ticketApi } from '../../services/api';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from '../../components/charts/RechartsWrapper';
import {
    Users,
    UserCheck,
    Shield,
    Award,
    Clock,
    CheckCircle,
    AlertCircle,
    Bell,
    RefreshCw,
    ArrowRight,
    ArrowUpRight,
    Activity,
    FileText,
    Settings,
    Loader2,
    HelpCircle,
    ChevronRight,
    Briefcase,
    MessageSquare,
    TrendingUp,
    BarChart3,
    PieChart as PieChartIcon,
    ClipboardList,
    Eye
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

interface TicketStats {
    summary: {
        total: number;
        open: number;
        inProgress: number;
        resolved: number;
        closed: number;
    };
    trend?: Array<{ date: string; count: number }>;
}

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    created_at: string;
    is_read: boolean;
}

const CHART_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [portalStats, setPortalStats] = useState<PortalStats | null>(null);
    const [ticketStats, setTicketStats] = useState<TicketStats | null>(null);
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
                notificationApi.getNotifications({ limit: 4 }).catch(() => ({ data: { success: false, data: null } })),
                notificationApi.getUnreadCount().catch(() => ({ data: { success: false, data: null } }))
            ]);

            if (statsRes.data.success && statsRes.data.data) {
                setPortalStats(statsRes.data.data);
            }

            if (ticketRes.data.success && ticketRes.data.data) {
                setTicketStats(ticketRes.data.data);
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

    const formatRelativeTime = (dateStr: string) => {
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

    // Chart data
    const userDistributionData = portalStats ? [
        { name: 'Customers', value: portalStats.customers, color: '#22c55e' },
        { name: 'Experts', value: portalStats.experts, color: '#f59e0b' },
        { name: 'Analysts', value: portalStats.analysts, color: '#8b5cf6' },
        { name: 'Admins', value: portalStats.admins, color: '#6366f1' }
    ].filter(d => d.value > 0) : [];

    const ticketStatusData = ticketStats?.summary ? [
        { name: 'Open', value: ticketStats.summary.open, color: '#f59e0b' },
        { name: 'In Progress', value: ticketStats.summary.inProgress, color: '#6366f1' },
        { name: 'Resolved', value: ticketStats.summary.resolved, color: '#22c55e' },
        { name: 'Closed', value: ticketStats.summary.closed, color: '#64748b' }
    ] : [];

    const trendData = ticketStats?.trend?.slice(-14).map(t => ({
        date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        tickets: t.count
    })) || [];

    // Quick links configuration
    const quickLinks = [
        { title: 'User Management', icon: Users, path: '/admin/users', color: 'primary', description: 'Manage all users' },
        { title: 'Expert Review', icon: Award, path: '/admin/expert-review', color: 'warning', description: 'Review applications' },
        { title: 'Task Assignment', icon: ClipboardList, path: '/admin/task-assignment', color: 'info', description: 'Assign tasks' },
        { title: 'Help Desk', icon: HelpCircle, path: '/help-desk', color: 'success', description: 'Support tickets' },
        { title: 'Reports', icon: BarChart3, path: '/admin/reports', color: 'accent', description: 'View analytics' },
        { title: 'Tickets', icon: MessageSquare, path: '/admin/tickets', color: 'purple', description: 'Manage tickets' },
    ];

    const superAdminLinks = [
        { title: 'Admin Management', icon: Shield, path: '/superadmin/admins', color: 'danger', description: 'Manage admins' },
        { title: 'System Logs', icon: FileText, path: '/superadmin/logs', color: 'secondary', description: 'View logs' },
        { title: 'Configuration', icon: Settings, path: '/superadmin/config', color: 'tertiary', description: 'System settings' },
    ];

    if (loading) {
        return (
            <div className="admin-dashboard-loading">
                <Loader2 className="spinner" size={40} />
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="admin-dashboard-v2">
            {/* Compact Header */}
            <header className="dashboard-header-v2">
                <div className="header-left">
                    <h1>{getWelcomeMessage()}, {user?.name?.split(' ')[0]}!</h1>
                    <p>Here's what's happening with your platform today.</p>
                </div>
                <div className="header-right">
                    <button className="icon-btn" onClick={handleRefresh} disabled={refreshing} title="Refresh">
                        <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
                    </button>
                    <Link to="/notifications" className="icon-btn notification-btn">
                        <Bell size={18} />
                        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                    </Link>
                </div>
            </header>

            {/* Stats Grid */}
            <section className="stats-grid-v2">
                <div className="stat-card-v2 primary">
                    <div className="stat-icon"><Users size={22} /></div>
                    <div className="stat-info">
                        <span className="stat-value">{portalStats?.totalUsers || 0}</span>
                        <span className="stat-label">Total Users</span>
                    </div>
                    <Link to="/admin/users" className="stat-action"><Eye size={16} /></Link>
                </div>
                <div className="stat-card-v2 success">
                    <div className="stat-icon"><UserCheck size={22} /></div>
                    <div className="stat-info">
                        <span className="stat-value">{portalStats?.activeUsers || 0}</span>
                        <span className="stat-label">Active Users</span>
                    </div>
                    <div className="stat-trend up"><TrendingUp size={14} /></div>
                </div>
                <div className="stat-card-v2 warning">
                    <div className="stat-icon"><Award size={22} /></div>
                    <div className="stat-info">
                        <span className="stat-value">{portalStats?.experts || 0}</span>
                        <span className="stat-label">Experts</span>
                    </div>
                </div>
                <div className="stat-card-v2 info">
                    <div className="stat-icon"><Briefcase size={22} /></div>
                    <div className="stat-info">
                        <span className="stat-value">{portalStats?.customers || 0}</span>
                        <span className="stat-label">Customers</span>
                    </div>
                </div>
                <div className="stat-card-v2 accent">
                    <div className="stat-icon"><Clock size={22} /></div>
                    <div className="stat-info">
                        <span className="stat-value">{portalStats?.pendingUsers || 0}</span>
                        <span className="stat-label">Pending</span>
                    </div>
                </div>
                {isSuperAdmin && (
                    <div className="stat-card-v2 danger">
                        <div className="stat-icon"><Shield size={22} /></div>
                        <div className="stat-info">
                            <span className="stat-value">{portalStats?.admins || 0}</span>
                            <span className="stat-label">Admins</span>
                        </div>
                    </div>
                )}
            </section>

            {/* Main Content Grid */}
            <div className="dashboard-grid-v2">
                {/* Left Column */}
                <div className="dashboard-column">
                    {/* Quick Links */}
                    <section className="dashboard-card-v2">
                        <div className="card-header-v2">
                            <h2><Activity size={18} /> Quick Access</h2>
                        </div>
                        <div className="quick-links-grid">
                            {quickLinks.map((link, i) => (
                                <Link key={i} to={link.path} className={`quick-link-v2 ${link.color}`}>
                                    <link.icon size={20} />
                                    <span>{link.title}</span>
                                    <ChevronRight size={16} className="link-arrow" />
                                </Link>
                            ))}
                            {isSuperAdmin && superAdminLinks.map((link, i) => (
                                <Link key={`sa-${i}`} to={link.path} className={`quick-link-v2 ${link.color}`}>
                                    <link.icon size={20} />
                                    <span>{link.title}</span>
                                    <ChevronRight size={16} className="link-arrow" />
                                </Link>
                            ))}
                        </div>
                    </section>

                    {/* Activity Trend Chart */}
                    <section className="dashboard-card-v2">
                        <div className="card-header-v2">
                            <h2><TrendingUp size={18} /> Ticket Trend</h2>
                            <span className="card-subtitle">Last 14 days</span>
                        </div>
                        <div className="chart-container">
                            {trendData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={200}>
                                    <AreaChart data={trendData}>
                                        <defs>
                                            <linearGradient id="ticketGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                                        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                                        <YAxis tick={{ fontSize: 11 }} stroke="var(--text-muted)" tickLine={false} axisLine={false} width={30} />
                                        <Tooltip 
                                            contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '8px', fontSize: '12px' }}
                                        />
                                        <Area type="monotone" dataKey="tickets" stroke="#6366f1" strokeWidth={2} fill="url(#ticketGradient)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="empty-chart-state">
                                    <BarChart3 size={32} />
                                    <p>No trend data available</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Middle Column */}
                <div className="dashboard-column">
                    {/* User Distribution */}
                    <section className="dashboard-card-v2">
                        <div className="card-header-v2">
                            <h2><PieChartIcon size={18} /> User Distribution</h2>
                        </div>
                        <div className="chart-container centered">
                            {userDistributionData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie
                                            data={userDistributionData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={55}
                                            outerRadius={85}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {userDistributionData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => [value, 'Users']} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="empty-chart-state">
                                    <PieChartIcon size={32} />
                                    <p>No user data</p>
                                </div>
                            )}
                        </div>
                        <div className="chart-legend">
                            {userDistributionData.map((item, i) => (
                                <div key={i} className="legend-item">
                                    <span className="legend-dot" style={{ background: item.color }}></span>
                                    <span className="legend-label">{item.name}</span>
                                    <span className="legend-value">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Support Status */}
                    <section className="dashboard-card-v2">
                        <div className="card-header-v2">
                            <h2><HelpCircle size={18} /> Support Status</h2>
                            <Link to="/help-desk" className="card-link">View All <ArrowRight size={14} /></Link>
                        </div>
                        <div className="support-stats-grid">
                            <div className="support-stat">
                                <div className="support-stat-icon total"><MessageSquare size={18} /></div>
                                <div className="support-stat-info">
                                    <span className="support-stat-value">{ticketStats?.summary?.total || 0}</span>
                                    <span className="support-stat-label">Total</span>
                                </div>
                            </div>
                            <div className="support-stat">
                                <div className="support-stat-icon open"><AlertCircle size={18} /></div>
                                <div className="support-stat-info">
                                    <span className="support-stat-value">{ticketStats?.summary?.open || 0}</span>
                                    <span className="support-stat-label">Open</span>
                                </div>
                            </div>
                            <div className="support-stat">
                                <div className="support-stat-icon progress"><Activity size={18} /></div>
                                <div className="support-stat-info">
                                    <span className="support-stat-value">{ticketStats?.summary?.inProgress || 0}</span>
                                    <span className="support-stat-label">In Progress</span>
                                </div>
                            </div>
                            <div className="support-stat">
                                <div className="support-stat-icon closed"><CheckCircle size={18} /></div>
                                <div className="support-stat-info">
                                    <span className="support-stat-value">{ticketStats?.summary?.closed || 0}</span>
                                    <span className="support-stat-label">Closed</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right Column */}
                <div className="dashboard-column">
                    {/* Recent Users */}
                    <section className="dashboard-card-v2">
                        <div className="card-header-v2">
                            <h2><Users size={18} /> Recent Users</h2>
                            <Link to="/admin/users" className="card-link">View All <ArrowRight size={14} /></Link>
                        </div>
                        <div className="recent-users-list">
                            {portalStats?.recentUsers && portalStats.recentUsers.length > 0 ? (
                                portalStats.recentUsers.slice(0, 5).map((u: any) => (
                                    <div key={u.id} className="recent-user-item">
                                        <div className="user-avatar-sm">{u.name?.charAt(0)?.toUpperCase() || '?'}</div>
                                        <div className="user-details">
                                            <span className="user-name-sm">{u.name}</span>
                                            <span className="user-role-sm">{u.role}</span>
                                        </div>
                                        <span className="user-time-sm">{formatRelativeTime(u.created_at)}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-list-state">
                                    <Users size={24} />
                                    <p>No recent users</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Notifications */}
                    <section className="dashboard-card-v2">
                        <div className="card-header-v2">
                            <h2>
                                <Bell size={18} /> Notifications
                                {unreadCount > 0 && <span className="header-badge">{unreadCount}</span>}
                            </h2>
                            <Link to="/notifications" className="card-link">View All <ArrowRight size={14} /></Link>
                        </div>
                        <div className="notifications-list-v2">
                            {notifications.length > 0 ? (
                                notifications.map(notif => (
                                    <div key={notif.id} className={`notification-item-v2 ${!notif.is_read ? 'unread' : ''}`}>
                                        <div className="notif-icon-v2">
                                            {notif.type === 'ticket' ? <MessageSquare size={14} /> : 
                                             notif.type === 'user' ? <Users size={14} /> : 
                                             <Bell size={14} />}
                                        </div>
                                        <div className="notif-content-v2">
                                            <span className="notif-title-v2">{notif.title}</span>
                                            <span className="notif-time-v2">{formatRelativeTime(notif.created_at)}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-list-state">
                                    <Bell size={24} />
                                    <p>No notifications</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
