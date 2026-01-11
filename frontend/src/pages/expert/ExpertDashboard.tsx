import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    Briefcase,
    CheckCircle,
    Clock,
    TrendingUp,
    FileText,
    ArrowRight,
    DollarSign,
    Loader2,
} from 'lucide-react';
import './ExpertDashboard.css';

interface ExpertStats {
    activeTasks: number;
    completedTasks: number;
    pendingTasks: number;
    totalEarnings: number;
}

interface RecentActivity {
    id: string;
    type: string;
    description: string;
    timestamp: string;
}

const ExpertDashboard: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<ExpertStats>({
        activeTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        totalEarnings: 0,
    });
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // TODO: Fetch from GET /api/expert/dashboard
            // For now, using placeholder data
            setStats({
                activeTasks: 0,
                completedTasks: 0,
                pendingTasks: 0,
                totalEarnings: 0,
            });
            setRecentActivity([]);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getWelcomeMessage = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const quickActions = [
        { label: 'View Tasks', path: '/expert/tasks', icon: <Briefcase size={20} />, color: 'primary' },
        { label: 'Portfolio', path: '/expert/portfolio', icon: <FileText size={20} />, color: 'success' },
        { label: 'Earnings', path: '/expert/earnings', icon: <TrendingUp size={20} />, color: 'warning' },
    ];

    if (loading) {
        return (
            <div className="expert-dashboard loading-state">
                <div className="loading-spinner">
                    <Loader2 size={48} className="spin" />
                </div>
                <p>Loading your dashboard...</p>
            </div>
        );
    }

    return (
        <div className="expert-dashboard">
            {/* Section A: Welcome & Activity */}
            <section className="welcome-section">
                <div className="welcome-header">
                    <h1>{getWelcomeMessage()}, {user?.name}!</h1>
                    <p>Here's what's happening with your account today.</p>
                </div>
            </section>

            {/* Quick Actions */}
            <section className="quick-actions-section">
                <h2 className="section-title">Quick Actions</h2>
                <div className="quick-actions-grid">
                    {quickActions.map((action, index) => (
                        <Link key={index} to={action.path} className={`quick-action-card ${action.color}`}>
                            <div className="action-icon">{action.icon}</div>
                            <span className="action-label">{action.label}</span>
                            <ArrowRight size={18} className="action-arrow" />
                        </Link>
                    ))}
                </div>
            </section>

            {/* Section B: Performance Overview - Stats Cards */}
            <section className="stats-section">
                <h2 className="section-title">Performance Overview</h2>
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon primary">
                            <Briefcase size={24} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{stats.activeTasks}</span>
                            <span className="stat-label">Active Tasks</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon success">
                            <CheckCircle size={24} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{stats.completedTasks}</span>
                            <span className="stat-label">Completed</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon warning">
                            <Clock size={24} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{stats.pendingTasks}</span>
                            <span className="stat-label">Pending</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon accent">
                            <DollarSign size={24} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">${stats.totalEarnings.toLocaleString()}</span>
                            <span className="stat-label">Earnings</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Recent Activity */}
            <section className="activity-section">
                <h2 className="section-title">Recent Activity</h2>
                <div className="activity-card">
                    {recentActivity.length > 0 ? (
                        <ul className="activity-list">
                            {recentActivity.map((activity) => (
                                <li key={activity.id} className="activity-item">
                                    <span className="activity-description">{activity.description}</span>
                                    <span className="activity-time">{activity.timestamp}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="empty-state">
                            <Clock size={48} />
                            <p>Your recent activity will appear here</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default ExpertDashboard;
