import React, { useState, useEffect } from 'react';
import { Activity, Search, Filter, RefreshCw, User, Clock } from 'lucide-react';
import { adminApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import './SystemLogs.css';

interface ActivityLog {
    id: string;
    user_id: string;
    user_name?: string;
    user_email?: string;
    action: string;
    entity_type: string;
    entity_id: string;
    metadata?: string;
    ip_address?: string;
    created_at: string;
}

const SystemLogs: React.FC = () => {
    const { error } = useToast();
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionFilter, setActionFilter] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchLogs();
    }, [actionFilter]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params: Record<string, any> = {};
            if (actionFilter) params.action = actionFilter;

            const response = await adminApi.getLogs(params);
            if (response.data.success && response.data.data) {
                setLogs(response.data.data.logs || []);
            }
        } catch (err: any) {
            if (err.response?.status === 403) {
                error('Superadmin access required to view logs');
            } else {
                error('Failed to fetch activity logs');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchLogs();
        setRefreshing(false);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString();
    };

    const getActionBadgeClass = (action: string) => {
        if (action.includes('CREATE')) return 'action-create';
        if (action.includes('UPDATE')) return 'action-update';
        if (action.includes('DELETE')) return 'action-delete';
        return 'action-default';
    };

    const parseMetadata = (metadata: string | undefined) => {
        if (!metadata) return null;
        try {
            return JSON.parse(metadata);
        } catch {
            return null;
        }
    };

    const actionTypes = ['CREATE_USER', 'UPDATE_USER', 'DELETE_USER', 'LOGIN', 'LOGOUT'];

    return (
        <div className="system-logs-page">
            <div className="page-header">
                <div>
                    <h1><Activity size={24} /> System Logs</h1>
                    <p>View activity logs and system events</p>
                </div>
                <button className="btn btn-secondary" onClick={handleRefresh} disabled={refreshing}>
                    <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
                    Refresh
                </button>
            </div>

            {/* Filters */}
            <div className="filters-section">
                <div className="filter-group">
                    <Filter size={18} />
                    <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
                        <option value="">All Actions</option>
                        {actionTypes.map(action => (
                            <option key={action} value={action}>{action.replace('_', ' ')}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Logs List */}
            <div className="logs-container">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner" />
                        <p>Loading logs...</p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="empty-state">
                        <Activity size={48} />
                        <h3>No logs found</h3>
                        <p>Activity logs will appear here when actions are performed</p>
                    </div>
                ) : (
                    <div className="logs-list">
                        {logs.map(log => {
                            const meta = parseMetadata(log.metadata);
                            return (
                                <div key={log.id} className="log-item">
                                    <div className="log-icon">
                                        <User size={18} />
                                    </div>
                                    <div className="log-content">
                                        <div className="log-header">
                                            <span className={`action-badge ${getActionBadgeClass(log.action)}`}>
                                                {log.action}
                                            </span>
                                            <span className="entity-info">
                                                {log.entity_type} • {log.entity_id?.substring(0, 8)}...
                                            </span>
                                        </div>
                                        <div className="log-user">
                                            <strong>{log.user_name || 'Unknown User'}</strong>
                                            <span>{log.user_email}</span>
                                        </div>
                                        {meta && (
                                            <div className="log-meta">
                                                {meta.name && <span>Name: {meta.name}</span>}
                                                {meta.email && <span>Email: {meta.email}</span>}
                                                {meta.role && <span>Role: {meta.role}</span>}
                                            </div>
                                        )}
                                    </div>
                                    <div className="log-time">
                                        <Clock size={14} />
                                        <span>{formatDate(log.created_at)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SystemLogs;
