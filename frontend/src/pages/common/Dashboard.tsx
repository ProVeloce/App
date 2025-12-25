import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminApi, applicationApi, taskApi, ticketApi, notificationApi } from '../../services/api';
import {
    Users,
    FileText,
    Briefcase,
    HelpCircle,
    Bell,
    TrendingUp,
    ArrowRight,
    CheckCircle,
    Clock,
    AlertCircle,
} from 'lucide-react';
import './Dashboard.css';

interface DashboardStats {
    totalUsers?: number;
    pendingApplications?: number;
    activeTasks?: number;
    openTickets?: number;
    unreadNotifications?: number;
}

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, [user]);

    const fetchDashboardData = async () => {
        try {
            const [notifRes] = await Promise.all([
                notificationApi.getUnreadCount(),
            ]);

            setStats({
                unreadNotifications: notifRes.data.data?.unreadCount || 0,
            });

            // Fetch role-specific data
            if (user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') {
                const [dashboardRes] = await Promise.all([
                    adminApi.getDashboard(),
                ]);
                if (dashboardRes.data.data?.stats) {
                    setStats(prev => ({ ...prev, ...dashboardRes.data.data.stats }));
                }
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getQuickActions = () => {
        switch (user?.role) {
            case 'CUSTOMER':
                return [
                    { label: 'Apply as Expert', path: '/customer/apply-expert', icon: <FileText size={20} />, color: 'primary' },
                    { label: 'View Application', path: '/customer/application-status', icon: <Clock size={20} />, color: 'warning' },
                    { label: 'Help Desk', path: '/help-desk', icon: <HelpCircle size={20} />, color: 'success' },
                ];
            case 'EXPERT':
                return [
                    { label: 'View Tasks', path: '/expert/tasks', icon: <Briefcase size={20} />, color: 'primary' },
                    { label: 'Portfolio', path: '/expert/portfolio', icon: <FileText size={20} />, color: 'success' },
                    { label: 'Earnings', path: '/expert/earnings', icon: <TrendingUp size={20} />, color: 'warning' },
                ];
            case 'ANALYST':
                return [
                    { label: 'Verify Experts', path: '/analyst/verification', icon: <CheckCircle size={20} />, color: 'primary' },
                    { label: 'Dashboard', path: '/analyst/dashboard', icon: <TrendingUp size={20} />, color: 'success' },
                ];
            case 'ADMIN':
                return [
                    { label: 'User Management', path: '/admin/users', icon: <Users size={20} />, color: 'primary' },
                    { label: 'Expert Review', path: '/admin/expert-review', icon: <CheckCircle size={20} />, color: 'success' },
                    { label: 'Reports', path: '/admin/reports', icon: <TrendingUp size={20} />, color: 'warning' },
                ];
            case 'SUPERADMIN':
                return [
                    { label: 'Admin Management', path: '/superadmin/admins', icon: <Users size={20} />, color: 'primary' },
                    { label: 'System Config', path: '/superadmin/config', icon: <AlertCircle size={20} />, color: 'warning' },
                    { label: 'System Logs', path: '/superadmin/logs', icon: <FileText size={20} />, color: 'success' },
                ];
            default:
                return [];
        }
    };

    const getWelcomeMessage = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner" />
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <div className="welcome-section">
                    <h1>{getWelcomeMessage()}, {user?.name}!</h1>
                    <p>Here's what's happening with your account today.</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                {stats.unreadNotifications !== undefined && stats.unreadNotifications > 0 && (
                    <div className="stat-card notification-card">
                        <div className="stat-icon">
                            <Bell size={24} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{stats.unreadNotifications}</span>
                            <span className="stat-label">Unread Notifications</span>
                        </div>
                        <Link to="/notifications" className="stat-link">
                            <ArrowRight size={18} />
                        </Link>
                    </div>
                )}

                {(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') && (
                    <>
                        <div className="stat-card">
                            <div className="stat-icon primary">
                                <Users size={24} />
                            </div>
                            <div className="stat-content">
                                <span className="stat-value">{stats.totalUsers || 0}</span>
                                <span className="stat-label">Total Users</span>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon warning">
                                <Clock size={24} />
                            </div>
                            <div className="stat-content">
                                <span className="stat-value">{stats.pendingApplications || 0}</span>
                                <span className="stat-label">Pending Applications</span>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon success">
                                <HelpCircle size={24} />
                            </div>
                            <div className="stat-content">
                                <span className="stat-value">{stats.openTickets || 0}</span>
                                <span className="stat-label">Open Tickets</span>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Quick Actions */}
            <div className="section">
                <h2 className="section-title">Quick Actions</h2>
                <div className="quick-actions-grid">
                    {getQuickActions().map((action, index) => (
                        <Link key={index} to={action.path} className={`quick-action-card ${action.color}`}>
                            <div className="action-icon">{action.icon}</div>
                            <span className="action-label">{action.label}</span>
                            <ArrowRight size={18} className="action-arrow" />
                        </Link>
                    ))}
                </div>
            </div>

            {/* Recent Activity Placeholder */}
            <div className="section">
                <h2 className="section-title">Recent Activity</h2>
                <div className="activity-card">
                    <div className="empty-state">
                        <Clock size={48} />
                        <p>Your recent activity will appear here</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
