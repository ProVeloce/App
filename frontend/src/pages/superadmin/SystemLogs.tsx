import React, { useState, useEffect, useMemo } from 'react';
import { 
    Activity, Search, Filter, RefreshCw, User, Clock, ChevronDown, ChevronRight,
    FileText, Settings, Ticket, Users, Shield, Bell, CheckCircle, XCircle,
    Eye, Download, Calendar, ArrowUpDown, AlertCircle
} from 'lucide-react';
import { adminApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import './SystemLogs.css';

interface ActivityLog {
    id: string;
    user_id: string;
    user_name?: string;
    user_email?: string;
    action: string;
    entity_type?: string;
    entity_id?: string;
    metadata?: string;
    ip_address?: string;
    details?: string;
    created_at: string;
}

interface ActionCategory {
    id: string;
    label: string;
    icon: React.ReactNode;
    actions: string[];
    color: string;
}

const ACTION_CATEGORIES: ActionCategory[] = [
    {
        id: 'user',
        label: 'User Management',
        icon: <Users size={16} />,
        actions: ['CREATE_USER', 'UPDATE_USER', 'DEACTIVATE_USER', 'DELETE_USER', 'USER_REGISTRATION', 'USER_ACTIVATION', 'CHANGE_PASSWORD'],
        color: 'primary'
    },
    {
        id: 'auth',
        label: 'Authentication',
        icon: <Shield size={16} />,
        actions: ['LOGIN', 'LOGIN_OAUTH', 'LOGIN_FAILED', 'LOGOUT', 'refresh_token_stored', 'refresh_token_fetched', 'refresh_token_revoked'],
        color: 'warning'
    },
    {
        id: 'ticket',
        label: 'Help Desk',
        icon: <Ticket size={16} />,
        actions: ['CREATE_TICKET', 'UPDATE_TICKET_STATUS', 'ASSIGN_TICKET', 'REASSIGN_TICKET', 'ADD_TICKET_MESSAGE', 'CLOSE_TICKET'],
        color: 'success'
    },
    {
        id: 'expert',
        label: 'Expert Applications',
        icon: <FileText size={16} />,
        actions: ['SUBMIT_EXPERT_APPLICATION', 'APPROVE_EXPERT_APPLICATION', 'REJECT_EXPERT_APPLICATION', 'EXPERT_APPLICATION_REVIEWED', 'UPDATE_EXPERT_APPLICATION'],
        color: 'info'
    },
    {
        id: 'config',
        label: 'Configuration',
        icon: <Settings size={16} />,
        actions: ['UPDATE_CONFIG', 'BULK_UPDATE_CONFIG'],
        color: 'purple'
    },
];

const SystemLogs: React.FC = () => {
    const { error, success } = useToast();
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [dateFilter, setDateFilter] = useState<'today' | '7d' | '30d' | 'all'>('7d');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    
    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 50;
    
    // Expanded log details
    const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchLogs();
    }, [actionFilter, page]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params: Record<string, any> = {
                page,
                limit: itemsPerPage
            };
            if (actionFilter) params.action = actionFilter;

            const response = await adminApi.getLogs(params);
            if (response.data.success && response.data.data) {
                setLogs(response.data.data.logs || []);
                if (response.data.data.pagination) {
                    setTotalPages(response.data.data.pagination.totalPages || 1);
                }
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
        success('Logs refreshed');
    };

    const toggleLogExpand = (logId: string) => {
        setExpandedLogs(prev => {
            const next = new Set(prev);
            if (next.has(logId)) {
                next.delete(logId);
            } else {
                next.add(logId);
            }
            return next;
        });
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString();
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
        return date.toLocaleDateString();
    };

    const getActionIcon = (action: string) => {
        if (action.includes('CREATE') || action.includes('REGISTRATION')) return <CheckCircle size={14} />;
        if (action.includes('DELETE') || action.includes('REJECT') || action.includes('FAILED')) return <XCircle size={14} />;
        if (action.includes('UPDATE') || action.includes('ASSIGN') || action.includes('APPROVE')) return <Activity size={14} />;
        if (action.includes('LOGIN') || action.includes('LOGOUT')) return <Shield size={14} />;
        if (action.includes('TICKET')) return <Ticket size={14} />;
        if (action.includes('CONFIG')) return <Settings size={14} />;
        return <Activity size={14} />;
    };

    const getActionBadgeClass = (action: string): string => {
        if (action.includes('CREATE') || action.includes('APPROVE') || action.includes('ACTIVATION')) return 'action-create';
        if (action.includes('UPDATE') || action.includes('ASSIGN') || action.includes('REASSIGN')) return 'action-update';
        if (action.includes('DELETE') || action.includes('REJECT') || action.includes('FAILED') || action.includes('revoked')) return 'action-delete';
        if (action.includes('LOGIN') || action.includes('LOGOUT')) return 'action-auth';
        return 'action-default';
    };

    const parseMetadata = (metadata: string | undefined | null, details?: string | undefined | null): Record<string, any> | null => {
        if (metadata) {
            try {
                return JSON.parse(metadata);
            } catch {
                // continue to try details
            }
        }
        if (details) {
            try {
                return JSON.parse(details);
            } catch {
                return null;
            }
        }
        return null;
    };

    const getCategoryForAction = (action: string): ActionCategory | undefined => {
        return ACTION_CATEGORIES.find(cat => 
            cat.actions.some(a => action.toUpperCase().includes(a.toUpperCase()) || a.toUpperCase().includes(action.toUpperCase()))
        );
    };

    // Filter logs based on search, category, and date
    const filteredLogs = useMemo(() => {
        let result = [...logs];

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(log => 
                log.user_name?.toLowerCase().includes(query) ||
                log.user_email?.toLowerCase().includes(query) ||
                log.action.toLowerCase().includes(query) ||
                log.entity_type?.toLowerCase().includes(query) ||
                log.entity_id?.toLowerCase().includes(query)
            );
        }

        // Category filter
        if (categoryFilter) {
            const category = ACTION_CATEGORIES.find(c => c.id === categoryFilter);
            if (category) {
                result = result.filter(log => 
                    category.actions.some(a => log.action.toUpperCase().includes(a.toUpperCase()))
                );
            }
        }

        // Date filter
        if (dateFilter !== 'all') {
            const now = new Date();
            const cutoff = new Date();
            if (dateFilter === 'today') cutoff.setHours(0, 0, 0, 0);
            else if (dateFilter === '7d') cutoff.setDate(now.getDate() - 7);
            else if (dateFilter === '30d') cutoff.setDate(now.getDate() - 30);
            
            result = result.filter(log => new Date(log.created_at) >= cutoff);
        }

        // Sort
        result.sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });

        return result;
    }, [logs, searchQuery, categoryFilter, dateFilter, sortOrder]);

    // Get unique actions for the filter
    const uniqueActions = useMemo(() => {
        const actions = new Set(logs.map(l => l.action));
        return Array.from(actions).sort();
    }, [logs]);

    const exportLogs = () => {
        const csv = [
            ['Timestamp', 'User', 'Email', 'Action', 'Entity Type', 'Entity ID', 'Details'].join(','),
            ...filteredLogs.map(log => [
                new Date(log.created_at).toISOString(),
                log.user_name || 'Unknown',
                log.user_email || '',
                log.action,
                log.entity_type || '',
                log.entity_id || '',
                JSON.stringify(parseMetadata(log.metadata, log.details) || {}).replace(/,/g, ';')
            ].join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        success('Logs exported successfully');
    };

    return (
        <div className="system-logs-page">
            {/* Header */}
            <header className="logs-header">
                <div className="header-left">
                    <h1><Activity size={24} /> Audit & Activity Logs</h1>
                    <p>Track all user actions and content changes across the platform</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-secondary" onClick={exportLogs}>
                        <Download size={16} /> Export
                    </button>
                    <button className="btn btn-secondary" onClick={handleRefresh} disabled={refreshing}>
                        <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            </header>

            {/* Filters Bar */}
            <div className="filters-bar">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search by user, action, entity..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="filter-group">
                    <label><Filter size={14} /> Category</label>
                    <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                        <option value="">All Categories</option>
                        {ACTION_CATEGORIES.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label><Activity size={14} /> Action</label>
                    <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}>
                        <option value="">All Actions</option>
                        {uniqueActions.map(action => (
                            <option key={action} value={action}>{action.replace(/_/g, ' ')}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label><Calendar size={14} /> Time</label>
                    <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value as any)}>
                        <option value="today">Today</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                        <option value="all">All Time</option>
                    </select>
                </div>

                <button 
                    className="sort-btn"
                    onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                    title={`Sort ${sortOrder === 'desc' ? 'oldest first' : 'newest first'}`}
                >
                    <ArrowUpDown size={16} />
                    {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
                </button>
            </div>

            {/* Category Quick Filters */}
            <div className="category-chips">
                {ACTION_CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        className={`category-chip ${cat.color} ${categoryFilter === cat.id ? 'active' : ''}`}
                        onClick={() => setCategoryFilter(categoryFilter === cat.id ? '' : cat.id)}
                    >
                        {cat.icon}
                        <span>{cat.label}</span>
                    </button>
                ))}
            </div>

            {/* Stats Summary */}
            <div className="logs-stats">
                <div className="stat-item">
                    <span className="stat-value">{filteredLogs.length}</span>
                    <span className="stat-label">Logs Found</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">{new Set(filteredLogs.map(l => l.user_id)).size}</span>
                    <span className="stat-label">Unique Users</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">{new Set(filteredLogs.map(l => l.action)).size}</span>
                    <span className="stat-label">Action Types</span>
                </div>
            </div>

            {/* Logs List */}
            <div className="logs-container">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner" />
                        <p>Loading activity logs...</p>
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="empty-state">
                        <Activity size={48} />
                        <h3>No logs found</h3>
                        <p>Activity logs will appear here when actions are performed</p>
                    </div>
                ) : (
                    <div className="logs-list">
                        {filteredLogs.map(log => {
                            const meta = parseMetadata(log.metadata, log.details);
                            const isExpanded = expandedLogs.has(log.id);
                            const category = getCategoryForAction(log.action);

                            return (
                                <div 
                                    key={log.id} 
                                    className={`log-item ${isExpanded ? 'expanded' : ''}`}
                                    onClick={() => toggleLogExpand(log.id)}
                                >
                                    <div className="log-main">
                                        <div className="log-icon-wrapper">
                                            {getActionIcon(log.action)}
                                        </div>
                                        
                                        <div className="log-content">
                                            <div className="log-header">
                                                <span className={`action-badge ${getActionBadgeClass(log.action)}`}>
                                                    {log.action.replace(/_/g, ' ')}
                                                </span>
                                                {category && (
                                                    <span className={`category-tag ${category.color}`}>
                                                        {category.icon}
                                                        {category.label}
                                                    </span>
                                                )}
                                                {log.entity_type && (
                                                    <span className="entity-tag">
                                                        {log.entity_type}
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <div className="log-handler">
                                                <User size={14} />
                                                <strong>{log.user_name || 'System'}</strong>
                                                {log.user_email && <span className="handler-email">{log.user_email}</span>}
                                            </div>
                                        </div>

                                        <div className="log-time-section">
                                            <span className="relative-time">{formatRelativeTime(log.created_at)}</span>
                                            <span className="absolute-time">{formatDate(log.created_at)}</span>
                                        </div>

                                        <div className="expand-indicator">
                                            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="log-details">
                                            <div className="detail-grid">
                                                <div className="detail-item">
                                                    <label>Handler ID</label>
                                                    <span className="mono">{log.user_id}</span>
                                                </div>
                                                {log.entity_id && (
                                                    <div className="detail-item">
                                                        <label>Entity ID</label>
                                                        <span className="mono">{log.entity_id}</span>
                                                    </div>
                                                )}
                                                {log.ip_address && (
                                                    <div className="detail-item">
                                                        <label>IP Address</label>
                                                        <span className="mono">{log.ip_address}</span>
                                                    </div>
                                                )}
                                                <div className="detail-item">
                                                    <label>Timestamp</label>
                                                    <span>{new Date(log.created_at).toISOString()}</span>
                                                </div>
                                            </div>
                                            
                                            {meta && Object.keys(meta).length > 0 && (
                                                <div className="metadata-section">
                                                    <h4><AlertCircle size={14} /> Action Details</h4>
                                                    <div className="metadata-grid">
                                                        {Object.entries(meta).map(([key, value]) => (
                                                            <div key={key} className="meta-item">
                                                                <label>{key.replace(/_/g, ' ')}</label>
                                                                <span>
                                                                    {typeof value === 'object' 
                                                                        ? JSON.stringify(value) 
                                                                        : String(value)
                                                                    }
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="pagination">
                    <button 
                        className="btn btn-secondary"
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                        Previous
                    </button>
                    <span className="page-info">Page {page} of {totalPages}</span>
                    <button 
                        className="btn btn-secondary"
                        disabled={page === totalPages}
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default SystemLogs;
