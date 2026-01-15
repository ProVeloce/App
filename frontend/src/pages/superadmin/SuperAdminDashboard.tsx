import React, { useState, useEffect } from 'react';
import { 
    Shield, Users, UserCheck, Briefcase, Activity, TrendingUp, Clock, 
    Eye, X, RefreshCw, Bell, ArrowRight, FileText, Settings, 
    ChevronRight, AlertCircle, CheckCircle, User as UserIcon, Award,
    MessageSquare, HelpCircle, BarChart3
} from 'lucide-react';
import { adminApi, adminUserApi, notificationApi, ticketApi, User } from '../../services/api';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { showGlobalError } from '../../context/ErrorContext';
import Avatar from '../../components/common/Avatar';
import { formatDate, formatDateTime, formatRelativeTime } from '../../utils/dateUtils';
import './SuperAdminDashboard.css';

interface Stats {
    totalUsers: number;
    admins: number;
    analysts: number;
    experts: number;
    customers: number;
    activeUsers: number;
    pendingUsers: number;
    recentUsers: any[];
}

interface UserDetail {
    user: any;
    profile?: any;
    bookings?: any[];
    sessions?: any[];
    expertApplication?: any;
    activityLogs?: any[];
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

const SuperAdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [ticketSummary, setTicketSummary] = useState<TicketSummary>({ total: 0, open: 0, inProgress: 0, closed: 0 });
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    
    // User detail modal
    const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [fetchingDetail, setFetchingDetail] = useState(false);

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

            if (statsRes.data?.success && statsRes.data?.data) {
                setStats(statsRes.data.data as Stats);
            }

            if (ticketRes.data?.success && ticketRes.data?.data?.summary) {
                const summary = ticketRes.data.data.summary;
                setTicketSummary({
                    total: summary.total || 0,
                    open: summary.open || 0,
                    inProgress: summary.inProgress || 0,
                    closed: summary.closed || 0
                });
            }

            if (notifRes.data?.success) {
                setNotifications(notifRes.data.data?.notifications || []);
            }

            if (notifCountRes.data?.success) {
                setUnreadCount(notifCountRes.data.data?.unreadCount || 0);
            }
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchDashboardData();
        setRefreshing(false);
    };

    const fetchUserDetail = async (id: string) => {
        setFetchingDetail(true);
        try {
            const response = await adminUserApi.getUserById(id);
            if (response.data.success && response.data.data) {
                setSelectedUser(response.data.data);
                setShowDetailModal(true);
            } else {
                showGlobalError('Fetch Failed', response.data.error || 'Failed to fetch user details');
            }
        } catch (err: any) {
            showGlobalError('Fetch Failed', err.response?.data?.error || err.message || 'An error occurred while fetching details');
        } finally {
            setFetchingDetail(false);
        }
    };

    const getWelcomeMessage = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    // formatRelativeTime is imported from utils/dateUtils

    const getRoleBadge = (role: string) => {
        return <span className={`role-badge ${role?.toLowerCase()}`}>{role}</span>;
    };

    // Quick links
    const quickLinks = [
        { title: 'User Management', icon: Users, path: '/admin/users', color: 'primary' },
        { title: 'Admin Management', icon: Shield, path: '/superadmin/admins', color: 'danger' },
        { title: 'Expert Review', icon: Award, path: '/admin/expert-review', color: 'warning' },
        { title: 'Help Desk', icon: HelpCircle, path: '/help-desk', color: 'success' },
        { title: 'System Logs', icon: FileText, path: '/superadmin/logs', color: 'secondary' },
        { title: 'Configuration', icon: Settings, path: '/superadmin/config', color: 'tertiary' },
        { title: 'Reports', icon: BarChart3, path: '/admin/reports', color: 'accent' },
        { title: 'Tickets', icon: MessageSquare, path: '/admin/tickets', color: 'purple' },
    ];

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="spinner" />
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="superadmin-dashboard-v2">
            {/* Header */}
            <header className="sa-header">
                <div className="sa-header-left">
                    <div className="sa-header-icon">
                        <Shield size={24} />
                    </div>
                    <div className="sa-header-text">
                        <h1>{getWelcomeMessage()}, {user?.name?.split(' ')[0]}!</h1>
                        <p>SuperAdmin Control Center - Full platform oversight</p>
                    </div>
                </div>
                <div className="sa-header-right">
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
            <section className="sa-stats-grid">
                <div className="sa-stat-card primary">
                    <div className="sa-stat-icon"><Users size={22} /></div>
                    <div className="sa-stat-info">
                        <span className="sa-stat-value">{stats?.totalUsers || 0}</span>
                        <span className="sa-stat-label">Total Users</span>
                    </div>
                    <Link to="/admin/users" className="sa-stat-action"><Eye size={16} /></Link>
                </div>
                <div className="sa-stat-card danger">
                    <div className="sa-stat-icon"><Shield size={22} /></div>
                    <div className="sa-stat-info">
                        <span className="sa-stat-value">{stats?.admins || 0}</span>
                        <span className="sa-stat-label">Admins</span>
                    </div>
                </div>
                <div className="sa-stat-card purple">
                    <div className="sa-stat-icon"><UserCheck size={22} /></div>
                    <div className="sa-stat-info">
                        <span className="sa-stat-value">{stats?.analysts || 0}</span>
                        <span className="sa-stat-label">Analysts</span>
                    </div>
                </div>
                <div className="sa-stat-card warning">
                    <div className="sa-stat-icon"><Award size={22} /></div>
                    <div className="sa-stat-info">
                        <span className="sa-stat-value">{stats?.experts || 0}</span>
                        <span className="sa-stat-label">Experts</span>
                    </div>
                </div>
                <div className="sa-stat-card info">
                    <div className="sa-stat-icon"><Briefcase size={22} /></div>
                    <div className="sa-stat-info">
                        <span className="sa-stat-value">{stats?.customers || 0}</span>
                        <span className="sa-stat-label">Customers</span>
                    </div>
                </div>
                <div className="sa-stat-card success">
                    <div className="sa-stat-icon"><TrendingUp size={22} /></div>
                    <div className="sa-stat-info">
                        <span className="sa-stat-value">{stats?.activeUsers || 0}</span>
                        <span className="sa-stat-label">Active</span>
                    </div>
                </div>
                <div className="sa-stat-card accent">
                    <div className="sa-stat-icon"><Clock size={22} /></div>
                    <div className="sa-stat-info">
                        <span className="sa-stat-value">{stats?.pendingUsers || 0}</span>
                        <span className="sa-stat-label">Pending</span>
                    </div>
                </div>
            </section>

            {/* Main Content Grid */}
            <div className="sa-dashboard-grid">
                {/* Quick Navigation */}
                <section className="sa-card">
                    <div className="sa-card-header">
                        <h2><Activity size={18} /> Quick Navigation</h2>
                    </div>
                    <div className="sa-quick-links">
                        {quickLinks.map((link, i) => (
                            <Link key={i} to={link.path} className={`sa-quick-link ${link.color}`}>
                                <link.icon size={18} />
                                <span>{link.title}</span>
                                <ChevronRight size={16} className="link-arrow" />
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Recent Users with View Details */}
                <section className="sa-card">
                    <div className="sa-card-header">
                        <h2><Users size={18} /> Recent Users</h2>
                        <Link to="/admin/users" className="card-link">View All <ArrowRight size={14} /></Link>
                    </div>
                    <div className="sa-users-list">
                        {stats?.recentUsers && stats.recentUsers.length > 0 ? (
                            stats.recentUsers.slice(0, 6).map((u: any) => (
                                <div key={u.id} className="sa-user-item">
                                    <div className="sa-user-avatar">
                                        {u.name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <div className="sa-user-info">
                                        <span className="sa-user-name">{u.name}</span>
                                        <span className="sa-user-email">{u.email}</span>
                                    </div>
                                    <div className="sa-user-meta">
                                        {getRoleBadge(u.role)}
                                        <span className="sa-user-time">{formatRelativeTime(u.created_at)}</span>
                                    </div>
                                    <button 
                                        className="sa-view-btn"
                                        onClick={() => fetchUserDetail(u.id)}
                                        disabled={fetchingDetail}
                                        title="View Details"
                                    >
                                        <Eye size={16} />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="sa-empty-state">
                                <Users size={32} />
                                <p>No recent users</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Support Overview */}
                <section className="sa-card">
                    <div className="sa-card-header">
                        <h2><HelpCircle size={18} /> Support Overview</h2>
                        <Link to="/help-desk" className="card-link">Open Help Desk <ArrowRight size={14} /></Link>
                    </div>
                    <div className="sa-support-stats">
                        <div className="sa-support-item">
                            <div className="sa-support-icon total"><MessageSquare size={18} /></div>
                            <div className="sa-support-info">
                                <span className="sa-support-value">{ticketSummary.total}</span>
                                <span className="sa-support-label">Total</span>
                            </div>
                        </div>
                        <div className="sa-support-item">
                            <div className="sa-support-icon open"><AlertCircle size={18} /></div>
                            <div className="sa-support-info">
                                <span className="sa-support-value">{ticketSummary.open}</span>
                                <span className="sa-support-label">Open</span>
                            </div>
                        </div>
                        <div className="sa-support-item">
                            <div className="sa-support-icon progress"><Activity size={18} /></div>
                            <div className="sa-support-info">
                                <span className="sa-support-value">{ticketSummary.inProgress}</span>
                                <span className="sa-support-label">In Progress</span>
                            </div>
                        </div>
                        <div className="sa-support-item">
                            <div className="sa-support-icon closed"><CheckCircle size={18} /></div>
                            <div className="sa-support-info">
                                <span className="sa-support-value">{ticketSummary.closed}</span>
                                <span className="sa-support-label">Closed</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Notifications */}
                <section className="sa-card">
                    <div className="sa-card-header">
                        <h2>
                            <Bell size={18} /> Notifications
                            {unreadCount > 0 && <span className="header-badge">{unreadCount}</span>}
                        </h2>
                        <Link to="/notifications" className="card-link">View All <ArrowRight size={14} /></Link>
                    </div>
                    <div className="sa-notifications-list">
                        {notifications.length > 0 ? (
                            notifications.map(notif => (
                                <div key={notif.id} className={`sa-notif-item ${!notif.is_read ? 'unread' : ''}`}>
                                    <div className="sa-notif-icon">
                                        {notif.type === 'ticket' ? <MessageSquare size={14} /> : 
                                         notif.type === 'user' ? <Users size={14} /> : 
                                         <Bell size={14} />}
                                    </div>
                                    <div className="sa-notif-content">
                                        <span className="sa-notif-title">{notif.title}</span>
                                        <span className="sa-notif-time">{formatRelativeTime(notif.created_at)}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="sa-empty-state">
                                <Bell size={32} />
                                <p>No notifications</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* User Detail Modal */}
            {showDetailModal && selectedUser && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowDetailModal(false)}>
                    <div className="modal-content user-detail-modal">
                        <div className="modal-header">
                            <div className="modal-header-content">
                                <Avatar src={selectedUser.user?.profile_image || selectedUser.user?.profile_photo_url} name={selectedUser.user?.name} />
                                <div>
                                    <h3>{selectedUser.user?.name}</h3>
                                    <span className="modal-subtitle">{selectedUser.user?.email}</span>
                                </div>
                            </div>
                            <button className="close-btn" onClick={() => setShowDetailModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <section className="detail-section">
                                <h4><UserIcon size={16} /> Profile Information</h4>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <label>Full Name</label>
                                        <span>{selectedUser.user?.name}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Email Address</label>
                                        <span>{selectedUser.user?.email}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Phone</label>
                                        <span>{selectedUser.user?.phone || 'N/A'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Role</label>
                                        {getRoleBadge(selectedUser.user?.role)}
                                    </div>
                                    <div className="detail-item">
                                        <label>Status</label>
                                        <span className={`status-tag ${selectedUser.user?.status?.toLowerCase()}`}>{selectedUser.user?.status}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Member Since</label>
                                        <span>{selectedUser.user?.created_at ? formatDate(selectedUser.user.created_at) : 'N/A'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Last Login</label>
                                        <span>{selectedUser.user?.last_login_at ? formatDateTime(selectedUser.user.last_login_at) : 'Never'}</span>
                                    </div>
                                </div>
                            </section>

                            <section className="detail-section">
                                <h4><Clock size={16} /> Booking History (Connect Requests)</h4>
                                {selectedUser.bookings && selectedUser.bookings.length > 0 ? (
                                    <div className="table-scroll">
                                        <table className="mini-table">
                                            <thead>
                                                <tr>
                                                    <th>Ref ID</th>
                                                    <th>{selectedUser.user?.role?.toLowerCase() === 'expert' ? 'Customer' : 'Expert'}</th>
                                                    <th>Status</th>
                                                    <th>Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedUser.bookings.map((b: any) => (
                                                    <tr key={b.id}>
                                                        <td>{b.id?.substring(0, 8) || 'N/A'}...</td>
                                                        <td>{selectedUser.user?.role?.toLowerCase() === 'expert' ? (b.customer_name || 'N/A') : (b.expert_name || 'N/A')}</td>
                                                        <td><span className={`status-tag ${b.status?.toLowerCase()}`}>{b.status}</span></td>
                                                        <td>{b.created_at ? formatDate(b.created_at) : 'N/A'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="no-data">No booking history available.</p>
                                )}
                            </section>

                            <section className="detail-section">
                                <h4><CheckCircle size={16} /> Session History (Meetings)</h4>
                                {selectedUser.sessions && selectedUser.sessions.length > 0 ? (
                                    <div className="table-scroll">
                                        <table className="mini-table">
                                            <thead>
                                                <tr>
                                                    <th>Meeting</th>
                                                    <th>With</th>
                                                    <th>Date</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedUser.sessions.map((s: any) => (
                                                    <tr key={s.id}>
                                                        <td>{s.title || 'Session'}</td>
                                                        <td>{selectedUser.user?.role?.toLowerCase() === 'expert' ? (s.customer_name || 'N/A') : (s.expert_name || 'N/A')}</td>
                                                        <td>{s.scheduled_date ? new Date(s.scheduled_date).toLocaleDateString() : 'N/A'}</td>
                                                        <td><span className={`status-tag ${s.status?.toLowerCase()}`}>{s.status}</span></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="no-data">No session history found.</p>
                                )}
                            </section>

                            {selectedUser.activityLogs && selectedUser.activityLogs.length > 0 && (
                                <section className="detail-section">
                                    <h4><Activity size={16} /> Recent Activity</h4>
                                    <div className="activity-list">
                                        {selectedUser.activityLogs.slice(0, 10).map((log: any) => (
                                            <div key={log.id} className="activity-item">
                                                <span className="activity-action">{log.action?.replace(/_/g, ' ')}</span>
                                                <span className="activity-time">{log.created_at ? formatDateTime(log.created_at) : ''}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Inline Styles for Modal (same as UserManagement) */}
            <style>{`
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 1rem; animation: fadeIn 0.2s ease-out; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .modal-content { background: var(--bg-primary, white); border-radius: 16px; width: 100%; max-width: 900px; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 50px rgba(0,0,0,0.25); animation: slideUp 0.3s ease-out; }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .modal-header { padding: 1.5rem; border-bottom: 1px solid var(--border-light, #eee); display: flex; justify-content: space-between; align-items: center; }
                .modal-header-content { display: flex; align-items: center; gap: 1rem; min-width: 0; flex: 1; }
                .modal-header-content > div { min-width: 0; flex: 1; }
                .modal-header-content h3 { margin: 0; font-size: 1.25rem; font-weight: 600; color: var(--text-primary, #333); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .modal-subtitle { font-size: 0.875rem; color: var(--text-secondary, #666); display: block; word-break: break-all; overflow-wrap: break-word; }
                .close-btn { background: var(--bg-tertiary, #f5f5f5); border: none; cursor: pointer; color: var(--text-secondary, #666); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
                .close-btn:hover { background: var(--bg-surface-secondary, #eee); color: var(--text-primary, #333); }
                .modal-body { padding: 1.5rem; }
                .detail-section { margin-bottom: 2rem; }
                .detail-section h4 { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; color: var(--primary-600, #6366f1); border-bottom: 2px solid var(--border-light, #f0f0f0); padding-bottom: 0.75rem; font-size: 1rem; }
                .detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1.25rem; }
                .detail-item { min-width: 0; overflow: hidden; }
                .detail-item label { display: block; font-size: 0.7rem; color: var(--text-tertiary, #888); margin-bottom: 0.25rem; text-transform: uppercase; letter-spacing: 0.5px; }
                .detail-item span { font-weight: 500; color: var(--text-primary, #333); display: block; word-break: break-word; overflow-wrap: break-word; }
                .table-scroll { overflow-x: auto; }
                .mini-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
                .mini-table th { text-align: left; padding: 0.75rem; background: var(--bg-surface-secondary, #f9fafb); border-bottom: 1px solid var(--border-light, #eee); font-weight: 600; font-size: 0.75rem; text-transform: uppercase; color: var(--text-secondary, #666); }
                .mini-table td { padding: 0.75rem; border-bottom: 1px solid var(--border-light, #eee); }
                .status-tag { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; text-transform: capitalize; font-weight: 500; }
                .status-tag.accepted, .status-tag.completed, .status-tag.active { background: #e6fcf5; color: #087f5b; }
                .status-tag.pending, .status-tag.pending_verification { background: #fff9db; color: #f08c00; }
                .status-tag.rejected, .status-tag.inactive, .status-tag.suspended { background: #fff5f5; color: #fa5252; }
                .status-tag.scheduled, .status-tag.in_progress { background: #e7f5ff; color: #1971c2; }
                .no-data { text-align: center; color: var(--text-muted, #888); font-style: italic; padding: 1.5rem; background: var(--bg-tertiary, #f9fafb); border-radius: 8px; }
                .activity-list { display: flex; flex-direction: column; gap: 0.5rem; }
                .activity-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--bg-tertiary, #f9fafb); border-radius: 8px; }
                .activity-action { font-size: 0.875rem; color: var(--text-primary, #333); text-transform: capitalize; }
                .activity-time { font-size: 0.75rem; color: var(--text-tertiary, #888); }
                [data-theme="dark"] .modal-content { background: var(--bg-secondary); }
                [data-theme="dark"] .mini-table th { background: var(--bg-tertiary); }
                [data-theme="dark"] .detail-item span { color: var(--text-primary); }
            `}</style>
        </div>
    );
};

export default SuperAdminDashboard;
