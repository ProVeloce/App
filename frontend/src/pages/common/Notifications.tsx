import React, { useState, useEffect } from 'react';
import { notificationApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Bell, Check, CheckCheck, Trash2, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import './Notifications.css';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
}

const Notifications: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const { success, error } = useToast();

    useEffect(() => {
        fetchNotifications();
    }, [filter]);

    const fetchNotifications = async () => {
        try {
            const response = await notificationApi.getNotifications({
                unreadOnly: filter === 'unread' ? 'true' : undefined,
            });
            if (response.data.success && response.data.data) {
                setNotifications(response.data.data.notifications || []);
            }
        } catch (err) {
            error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await notificationApi.markAsRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            );
        } catch (err) {
            error('Failed to mark as read');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationApi.markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            success('All notifications marked as read');
        } catch (err) {
            error('Failed to mark all as read');
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'SUCCESS':
                return <CheckCircle size={20} className="icon-success" />;
            case 'WARNING':
                return <AlertTriangle size={20} className="icon-warning" />;
            case 'ERROR':
                return <XCircle size={20} className="icon-error" />;
            default:
                return <Info size={20} className="icon-info" />;
        }
    };

    const formatTime = (date: string) => {
        const now = new Date();
        const notifDate = new Date(date);
        const diff = now.getTime() - notifDate.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return notifDate.toLocaleDateString();
    };

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return (
        <div className="notifications-page">
            <div className="page-header">
                <div className="header-left">
                    <h1>
                        <Bell size={24} />
                        Notifications
                        {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
                    </h1>
                </div>
                <div className="header-actions">
                    {unreadCount > 0 && (
                        <button className="btn btn-ghost" onClick={handleMarkAllAsRead}>
                            <CheckCheck size={18} />
                            Mark all as read
                        </button>
                    )}
                </div>
            </div>

            <div className="filter-tabs">
                <button
                    className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All
                </button>
                <button
                    className={`filter-tab ${filter === 'unread' ? 'active' : ''}`}
                    onClick={() => setFilter('unread')}
                >
                    Unread
                </button>
            </div>

            <div className="notifications-list">
                {loading ? (
                    <div className="loading-state">
                        <div className="loading-spinner" />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="empty-state">
                        <Bell size={48} />
                        <h3>No notifications</h3>
                        <p>You're all caught up!</p>
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
                            onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                        >
                            <div className="notification-icon">
                                {getNotificationIcon(notification.type)}
                            </div>
                            <div className="notification-content">
                                <h4>{notification.title}</h4>
                                <p>{notification.message}</p>
                                <span className="notification-time">{formatTime(notification.createdAt)}</span>
                            </div>
                            {!notification.isRead && (
                                <div className="unread-dot" />
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Notifications;
