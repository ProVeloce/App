import React, { useState, useEffect } from 'react';
import { Shield, Users, UserCheck, Briefcase, Activity, TrendingUp, Clock } from 'lucide-react';
import { adminApi, User } from '../../services/api';
import { Link } from 'react-router-dom';
import './SuperAdminDashboard.css';

interface Stats {
    totalUsers: number;
    admins: number;
    analysts: number;
    experts: number;
    customers: number;
    activeUsers: number;
    pendingUsers: number;
    recentUsers: User[];
}

const SuperAdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await adminApi.getStats();
            if (response.data?.success && response.data?.data) {
                setStats(response.data.data as Stats);
            }
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="spinner" />
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="superadmin-dashboard">
            <div className="page-header">
                <h1><Shield size={24} /> SuperAdmin Dashboard</h1>
                <p>System-wide control center</p>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon primary"><Users size={24} /></div>
                    <div className="stat-content">
                        <span className="stat-value">{stats?.totalUsers || 0}</span>
                        <span className="stat-label">Total Users</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon purple"><Shield size={24} /></div>
                    <div className="stat-content">
                        <span className="stat-value">{stats?.admins || 0}</span>
                        <span className="stat-label">Admins</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon blue"><UserCheck size={24} /></div>
                    <div className="stat-content">
                        <span className="stat-value">{stats?.analysts || 0}</span>
                        <span className="stat-label">Analysts</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon orange"><Briefcase size={24} /></div>
                    <div className="stat-content">
                        <span className="stat-value">{stats?.experts || 0}</span>
                        <span className="stat-label">Experts</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green"><TrendingUp size={24} /></div>
                    <div className="stat-content">
                        <span className="stat-value">{stats?.activeUsers || 0}</span>
                        <span className="stat-label">Active Users</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon yellow"><Clock size={24} /></div>
                    <div className="stat-content">
                        <span className="stat-value">{stats?.pendingUsers || 0}</span>
                        <span className="stat-label">Pending Verification</span>
                    </div>
                </div>
            </div>

            {/* Quick Actions & Recent Users */}
            <div className="dashboard-grid">
                <div className="dashboard-card">
                    <div className="card-header">
                        <h2>Quick Actions</h2>
                    </div>
                    <div className="card-body">
                        <div className="quick-actions">
                            <Link to="/superadmin/admins" className="action-btn">
                                <Users size={20} />
                                <span>Manage Users</span>
                            </Link>
                            <Link to="/superadmin/logs" className="action-btn">
                                <Activity size={20} />
                                <span>View Logs</span>
                            </Link>
                            <Link to="/superadmin/config" className="action-btn">
                                <Shield size={20} />
                                <span>System Config</span>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="dashboard-card">
                    <div className="card-header">
                        <h2>Recent Users</h2>
                        <Link to="/superadmin/admins" className="view-all">View All</Link>
                    </div>
                    <div className="card-body">
                        {stats?.recentUsers && stats.recentUsers.length > 0 ? (
                            <div className="recent-list">
                                {stats.recentUsers.map(user => (
                                    <div key={user.id} className="recent-item">
                                        <div className="user-avatar">
                                            {user.name?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                        <div className="user-info">
                                            <span className="user-name">{user.name || 'Unnamed'}</span>
                                            <span className="user-email">{user.email}</span>
                                        </div>
                                        <span className={`role-badge ${user.role?.toLowerCase()}`}>
                                            {user.role}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="no-data">No recent users</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
