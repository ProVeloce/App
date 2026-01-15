import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ticketApi, notificationApi, adminApi } from '../../services/api';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from '../../components/charts/RechartsWrapper';
import {
    Ticket,
    Users,
    Clock,
    CheckCircle,
    AlertCircle,
    TrendingUp,
    Bell,
    Plus,
    UserPlus,
    RefreshCw,
    Search,
    Filter,
    ArrowRight,
    Activity,
    Target,
    XCircle,
    AlertTriangle,
    BarChart3,
    FileText,
    Settings,
    ChevronDown,
    Loader2
} from 'lucide-react';
import './AdminDashboard.css';

interface TicketStats {
    summary: {
        total: number;
        open: number;
        inProgress: number;
        resolved: number;
        closed: number;
        avgResolutionHours: number;
    };
    byPriority: {
        low: number;
        medium: number;
        high: number;
        urgent: number;
    };
    byCategory: Array<{ name: string; value: number }>;
    trend: Array<{ date: string; count: number }>;
    workload: Array<{ assignee_name: string; ticket_count: number; open_count: number; in_progress_count: number }>;
    recentTickets: Array<{
        id: number;
        ticket_number: string;
        subject: string;
        status: string;
        priority: string;
        category: string;
        created_at: string;
        raised_by_name: string;
    }>;
}

interface AdminStats {
    totalUsers?: number;
    pendingApplications?: number;
    activeUsers?: number;
}

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    created_at: string;
    is_read: boolean;
}

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
const PRIORITY_COLORS: Record<string, string> = {
    low: '#22c55e',
    medium: '#f59e0b',
    high: '#f97316',
    urgent: '#ef4444'
};

const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [ticketStats, setTicketStats] = useState<TicketStats | null>(null);
    const [adminStats, setAdminStats] = useState<AdminStats>({});
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    
    // Filter states
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const isSuperAdmin = user?.role === 'SUPERADMIN';

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [statsRes, notifRes, notifCountRes, adminRes] = await Promise.all([
                ticketApi.getStats(),
                notificationApi.getNotifications({ limit: 5 }),
                notificationApi.getUnreadCount(),
                adminApi.getDashboard().catch(() => ({ data: { data: {} } }))
            ]);

            if (statsRes.data.success) {
                setTicketStats(statsRes.data.data);
            }

            if (notifRes.data.success) {
                setNotifications(notifRes.data.data?.notifications || []);
            }

            if (notifCountRes.data.success) {
                setUnreadCount(notifCountRes.data.data?.unreadCount || 0);
            }

            if (adminRes.data?.data) {
                setAdminStats(adminRes.data.data as AdminStats);
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
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const formatResolutionTime = (hours: number) => {
        if (hours < 1) return '< 1h';
        if (hours < 24) return `${Math.round(hours)}h`;
        const days = Math.round(hours / 24);
        return `${days}d`;
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'open': return 'status-open';
            case 'in progress': return 'status-progress';
            case 'resolved': return 'status-resolved';
            case 'closed': return 'status-closed';
            default: return '';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority.toLowerCase()) {
            case 'urgent': return 'priority-urgent';
            case 'high': return 'priority-high';
            case 'medium': return 'priority-medium';
            case 'low': return 'priority-low';
            default: return '';
        }
    };

    // Filter recent tickets
    const filteredTickets = ticketStats?.recentTickets.filter(ticket => {
        if (statusFilter !== 'all' && ticket.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
        if (priorityFilter !== 'all' && ticket.priority.toLowerCase() !== priorityFilter.toLowerCase()) return false;
        if (searchQuery && !ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) && 
            !ticket.ticket_number.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    }) || [];

    // Prepare chart data
    const statusChartData = ticketStats ? [
        { name: 'Open', value: ticketStats.summary.open, color: '#6366f1' },
        { name: 'In Progress', value: ticketStats.summary.inProgress, color: '#f59e0b' },
        { name: 'Resolved', value: ticketStats.summary.resolved, color: '#22c55e' },
        { name: 'Closed', value: ticketStats.summary.closed, color: '#64748b' }
    ] : [];

    const priorityChartData = ticketStats ? [
        { name: 'Low', count: ticketStats.byPriority.low, fill: PRIORITY_COLORS.low },
        { name: 'Medium', count: ticketStats.byPriority.medium, fill: PRIORITY_COLORS.medium },
        { name: 'High', count: ticketStats.byPriority.high, fill: PRIORITY_COLORS.high },
        { name: 'Urgent', count: ticketStats.byPriority.urgent, fill: PRIORITY_COLORS.urgent }
    ] : [];

    const trendChartData = ticketStats?.trend.map(t => ({
        date: formatDate(t.date),
        tickets: t.count
    })) || [];

    if (loading) {
        return (
            <div className="admin-dashboard-loading">
                <Loader2 className="spinner" size={40} />
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            {/* Header */}
            <div className="dashboard-header">
                <div className="header-content">
                    <div className="welcome-section">
                        <h1>{getWelcomeMessage()}, {user?.name}!</h1>
                        <p className="subtitle">
                            {isSuperAdmin ? 'System-wide overview and management' : 'Your assigned tickets and performance'}
                        </p>
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

            {/* Key Metrics */}
            <div className="metrics-grid">
                <div className="metric-card primary">
                    <div className="metric-icon">
                        <Ticket size={24} />
                    </div>
                    <div className="metric-content">
                        <span className="metric-value">{ticketStats?.summary.total || 0}</span>
                        <span className="metric-label">Total Tickets</span>
                    </div>
                    <div className="metric-trend up">
                        <TrendingUp size={14} />
                    </div>
                </div>

                <div className="metric-card warning">
                    <div className="metric-icon">
                        <AlertCircle size={24} />
                    </div>
                    <div className="metric-content">
                        <span className="metric-value">{ticketStats?.summary.open || 0}</span>
                        <span className="metric-label">Open Tickets</span>
                    </div>
                </div>

                <div className="metric-card info">
                    <div className="metric-icon">
                        <Activity size={24} />
                    </div>
                    <div className="metric-content">
                        <span className="metric-value">{ticketStats?.summary.inProgress || 0}</span>
                        <span className="metric-label">In Progress</span>
                    </div>
                </div>

                <div className="metric-card success">
                    <div className="metric-icon">
                        <CheckCircle size={24} />
                    </div>
                    <div className="metric-content">
                        <span className="metric-value">{ticketStats?.summary.closed || 0}</span>
                        <span className="metric-label">Closed</span>
                    </div>
                </div>

                <div className="metric-card accent">
                    <div className="metric-icon">
                        <Clock size={24} />
                    </div>
                    <div className="metric-content">
                        <span className="metric-value">
                            {formatResolutionTime(ticketStats?.summary.avgResolutionHours || 0)}
                        </span>
                        <span className="metric-label">Avg. Resolution</span>
                    </div>
                </div>

                {isSuperAdmin && (
                    <div className="metric-card purple">
                        <div className="metric-icon">
                            <Users size={24} />
                        </div>
                        <div className="metric-content">
                            <span className="metric-value">{adminStats.totalUsers || 0}</span>
                            <span className="metric-label">Total Users</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="section">
                <h2 className="section-title">
                    <Target size={20} />
                    Quick Actions
                </h2>
                <div className="quick-actions">
                    <Link to="/help-desk" className="action-btn primary">
                        <Plus size={18} />
                        <span>Create Ticket</span>
                    </Link>
                    <Link to="/help-desk" className="action-btn secondary">
                        <UserPlus size={18} />
                        <span>Assign Ticket</span>
                    </Link>
                    <Link to="/admin/users" className="action-btn tertiary">
                        <Users size={18} />
                        <span>Manage Users</span>
                    </Link>
                    {isSuperAdmin && (
                        <Link to="/superadmin/logs" className="action-btn quaternary">
                            <FileText size={18} />
                            <span>View Logs</span>
                        </Link>
                    )}
                </div>
            </div>

            {/* Charts Section */}
            <div className="charts-section">
                {/* Ticket Trend */}
                <div className="chart-card wide">
                    <div className="chart-header">
                        <h3>
                            <TrendingUp size={18} />
                            Ticket Trend (Last 30 Days)
                        </h3>
                    </div>
                    <div className="chart-body">
                        {trendChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={trendChartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                                    <XAxis 
                                        dataKey="date" 
                                        tick={{ fontSize: 12 }}
                                        stroke="var(--text-muted)"
                                    />
                                    <YAxis 
                                        tick={{ fontSize: 12 }}
                                        stroke="var(--text-muted)"
                                    />
                                    <Tooltip 
                                        contentStyle={{
                                            background: 'var(--bg-primary)',
                                            border: '1px solid var(--border-light)',
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="tickets" 
                                        stroke="#6366f1" 
                                        strokeWidth={2}
                                        dot={{ fill: '#6366f1', strokeWidth: 2 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="empty-chart">
                                <BarChart3 size={48} />
                                <p>No trend data available</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Status Distribution */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>
                            <Activity size={18} />
                            Status Distribution
                        </h3>
                    </div>
                    <div className="chart-body">
                        {statusChartData.some(d => d.value > 0) ? (
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie
                                        data={statusChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {statusChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="empty-chart">
                                <Activity size={48} />
                                <p>No tickets yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Priority Distribution */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>
                            <AlertTriangle size={18} />
                            By Priority
                        </h3>
                    </div>
                    <div className="chart-body">
                        {priorityChartData.some(d => d.count > 0) ? (
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={priorityChartData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                                    <XAxis type="number" tick={{ fontSize: 12 }} stroke="var(--text-muted)" />
                                    <YAxis 
                                        type="category" 
                                        dataKey="name" 
                                        tick={{ fontSize: 12 }}
                                        stroke="var(--text-muted)"
                                        width={60}
                                    />
                                    <Tooltip />
                                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                        {priorityChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="empty-chart">
                                <AlertTriangle size={48} />
                                <p>No priority data</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Section: Recent Tickets & Notifications */}
            <div className="bottom-section">
                {/* Recent Tickets */}
                <div className="panel tickets-panel">
                    <div className="panel-header">
                        <h3>
                            <Ticket size={18} />
                            Recent Tickets
                        </h3>
                        <div className="panel-actions">
                            <button 
                                className="btn-filter"
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <Filter size={16} />
                                <ChevronDown size={14} className={showFilters ? 'rotated' : ''} />
                            </button>
                            <Link to="/help-desk" className="btn-view-all">
                                View All <ArrowRight size={14} />
                            </Link>
                        </div>
                    </div>

                    {showFilters && (
                        <div className="filters-bar">
                            <div className="search-box">
                                <Search size={16} />
                                <input
                                    type="text"
                                    placeholder="Search tickets..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="filter-select"
                            >
                                <option value="all">All Status</option>
                                <option value="open">Open</option>
                                <option value="in progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                            </select>
                            <select
                                value={priorityFilter}
                                onChange={(e) => setPriorityFilter(e.target.value)}
                                className="filter-select"
                            >
                                <option value="all">All Priority</option>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                    )}

                    <div className="tickets-list">
                        {filteredTickets.length > 0 ? (
                            filteredTickets.map(ticket => (
                                <div 
                                    key={ticket.id} 
                                    className="ticket-item"
                                    onClick={() => navigate(`/help-desk?ticket=${ticket.ticket_number}`)}
                                >
                                    <div className="ticket-main">
                                        <span className="ticket-number">#{ticket.ticket_number}</span>
                                        <span className="ticket-subject">{ticket.subject}</span>
                                    </div>
                                    <div className="ticket-meta">
                                        <span className={`status-badge ${getStatusColor(ticket.status)}`}>
                                            {ticket.status}
                                        </span>
                                        <span className={`priority-badge ${getPriorityColor(ticket.priority)}`}>
                                            {ticket.priority}
                                        </span>
                                        <span className="ticket-date">
                                            {formatDate(ticket.created_at)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">
                                <Ticket size={32} />
                                <p>No tickets found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Notifications Panel */}
                <div className="panel notifications-panel">
                    <div className="panel-header">
                        <h3>
                            <Bell size={18} />
                            Recent Notifications
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
                                        {notif.type === 'ticket' ? <Ticket size={16} /> : 
                                         notif.type === 'alert' ? <AlertCircle size={16} /> : 
                                         <Bell size={16} />}
                                    </div>
                                    <div className="notif-content">
                                        <span className="notif-title">{notif.title}</span>
                                        <span className="notif-message">{notif.message}</span>
                                        <span className="notif-time">
                                            {formatDate(notif.created_at)}
                                        </span>
                                    </div>
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

                {/* Workload Distribution (SuperAdmin only) */}
                {isSuperAdmin && ticketStats?.workload && ticketStats.workload.length > 0 && (
                    <div className="panel workload-panel">
                        <div className="panel-header">
                            <h3>
                                <Users size={18} />
                                Team Workload
                            </h3>
                        </div>
                        <div className="workload-list">
                            {ticketStats.workload.map((item, index) => (
                                <div key={index} className="workload-item">
                                    <div className="workload-user">
                                        <div className="avatar">
                                            {item.assignee_name?.charAt(0) || '?'}
                                        </div>
                                        <span className="user-name">{item.assignee_name || 'Unassigned'}</span>
                                    </div>
                                    <div className="workload-stats">
                                        <span className="stat total">{item.ticket_count} total</span>
                                        <span className="stat open">{item.open_count} open</span>
                                        <span className="stat progress">{item.in_progress_count} in progress</span>
                                    </div>
                                    <div className="workload-bar">
                                        <div 
                                            className="bar-fill"
                                            style={{ 
                                                width: `${Math.min((item.ticket_count / Math.max(...ticketStats.workload.map(w => w.ticket_count))) * 100, 100)}%` 
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
