import React, { useState, useEffect } from 'react';
import {
    Users,
    Search,
    Shield,
    User as UserIcon,
    Award,
    Clock,
    Edit,
    Trash2,
    RefreshCw,
    AlertCircle,
    MoreVertical,
    CheckCircle,
    Eye,
    X,
    Calendar,
    Mail,
    Phone,
    Activity,
    FileText,
    Bell,
    LogIn,
    Briefcase,
    BarChart3,
    History
} from 'lucide-react';
import { adminUserApi } from '../../services/api';
import Avatar from '../../components/common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatDateTime } from '../../utils/dateUtils';
import { showGlobalError, showGlobalSuccess } from '../../context/ErrorContext';
import { useAlert } from '../../context/AlertContext';
import './UserManagement.css';

interface UserData {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    profile_image?: string;
    profile_photo_url?: string;
    created_at: string;
    updated_at?: string;
    last_login_at?: string;
    email_verified?: boolean;
}

interface UserDetail {
    user: UserData;
    profile?: any;
    bookings?: any[];
    sessions?: any[];
    expertApplication?: any;
    activityLogs?: any[];
    loginHistory?: any[];
    tickets?: any[];
    notifications?: any[];
    accountStats?: {
        totalBookings: number;
        totalSessions: number;
        totalTickets: number;
        totalActivityLogs: number;
        acceptedBookings: number;
        completedSessions: number;
        openTickets: number;
    };
    fetchedAt?: string;
}

interface Stats {
    totalUsers: number;
    admins: number;
    experts: number;
    pendingUsers: number;
}

const UserManagement: React.FC = () => {
    const { user: currentUser } = useAuth();
    const { confirm } = useAlert();
    const [users, setUsers] = useState<UserData[]>([]);
    const [stats, setStats] = useState<Stats>({ totalUsers: 0, admins: 0, experts: 0, pendingUsers: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [fetchingDetail, setFetchingDetail] = useState(false);

    const isSuperAdmin = currentUser?.role?.toLowerCase() === 'superadmin';

    useEffect(() => {
        fetchUsers();
        fetchStats();
    }, [searchTerm, roleFilter, statusFilter, page]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await adminUserApi.getUsers({
                search: searchTerm,
                role: roleFilter,
                status: statusFilter,
                page,
                limit: 10
            });
            if (response.data.success && response.data.data) {
                setUsers(response.data.data.users);
                setTotalPages(response.data.data.pagination.totalPages);
            }
        } catch (err: any) {
            showGlobalError('Fetch Failed', err.message || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await adminUserApi.getAdminStats();
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (err: any) {
            console.error('Failed to fetch stats', err);
        }
    };

    const handleUpdateUser = async (id: string, updates: Partial<UserData>) => {
        setIsUpdating(id);
        try {
            const response = await adminUserApi.updateUser(id, {
                ...updates,
                save_cta_state: 'enabled',
                save_cta_action: 'commit_changes_to_db'
            });
            if (response.data.success) {
                showGlobalSuccess('User Updated', 'User details updated successfully');
                fetchUsers();
                fetchStats();
            } else {
                showGlobalError('Update Failed', response.data.error || 'Failed to update user');
            }
        } catch (err: any) {
            showGlobalError('Update Failed', err.response?.data?.error || err.message);
        } finally {
            setIsUpdating(null);
        }
    };

    const handleDeactivate = async (id: string) => {
        const confirmed = await confirm(
            'Deactivate User',
            'Are you sure you want to deactivate this user? They will no longer be able to access the platform.',
            {
                type: 'warning',
                confirmText: 'Deactivate',
                cancelText: 'Cancel'
            }
        );
        
        if (!confirmed) return;

        setIsUpdating(id);
        try {
            const response = await adminUserApi.deactivateUser(id);
            if (response.data.success) {
                showGlobalSuccess('User Deactivated', 'User status set to inactive');
                fetchUsers();
                fetchStats();
            }
        } catch (err: any) {
            showGlobalError('Action Failed', err.message);
        } finally {
            setIsUpdating(null);
        }
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

    const getRoleBadge = (role: string) => {
        const r = role.toLowerCase();
        return <span className={`role-badge ${r}`}>{role}</span>;
    };

    return (
        <div className="page user-management-page">
            <div className="page-header">
                <div>
                    <h1>User Management</h1>
                    <p className="header-subtitle">Oversee platform roles, statuses, and account activities</p>
                </div>
                <button className="btn btn-primary" onClick={fetchUsers}>
                    <RefreshCw size={18} className={loading ? 'spin' : ''} />
                    Sync Data
                </button>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon users"><Users size={20} /></div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.totalUsers}</span>
                        <span className="stat-label">Total Users</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon admins"><Shield size={20} /></div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.admins}</span>
                        <span className="stat-label">Admins</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon experts"><Award size={20} /></div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.experts}</span>
                        <span className="stat-label">Experts</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon pending"><Clock size={20} /></div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.pendingUsers}</span>
                        <span className="stat-label">Pending Verif.</span>
                    </div>
                </div>
            </div>

            <div className="management-toolbar">
                <div className="search-container">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <select
                        className="filter-select"
                        value={roleFilter}
                        onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                    >
                        <option value="">All Roles</option>
                        <option value="superadmin">Superadmin</option>
                        <option value="admin">Admin</option>
                        <option value="analyst">Analyst</option>
                        <option value="expert">Expert</option>
                        <option value="customer">Customer</option>
                    </select>
                    <select
                        className="filter-select"
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    >
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending_verification">Pending Verification</option>
                    </select>
                </div>
            </div>

            <div className="users-table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>User Details</th>
                            <th>Role</th>
                            <th>Status (Dropdown)</th>
                            <th>Created On</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length > 0 ? (
                            users.map((u) => (
                                <tr key={u.id}>
                                    <td>
                                        <div className="user-info-cell">
                                            <div className="user-avatar">
                                                <Avatar
                                                    src={u.profile_image || u.profile_photo_url}
                                                    name={u.name}
                                                />
                                            </div>
                                            <div className="user-details">
                                                <span className="user-name">{u.name}</span>
                                                <span className="user-email">{u.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        {isSuperAdmin && u.role !== 'superadmin' ? (
                                            <select
                                                className="filter-select select-sm"
                                                value={u.role}
                                                onChange={(e) => handleUpdateUser(u.id, { role: e.target.value })}
                                                disabled={isUpdating === u.id}
                                            >
                                                <option value="Customer">Customer</option>
                                                <option value="Expert">Expert</option>
                                                <option value="admin">Admin</option>
                                                <option value="superadmin">Superadmin</option>
                                            </select>
                                        ) : (
                                            getRoleBadge(u.role)
                                        )}
                                    </td>
                                    <td>
                                        <select
                                            className={`status-dropdown status-${u.status.toLowerCase()}`}
                                            value={u.status.toLowerCase()}
                                            onChange={(e) => handleUpdateUser(u.id, { status: e.target.value })}
                                            disabled={isUpdating === u.id || (u.role === 'superadmin' && !isSuperAdmin)}
                                        >
                                            <option value="active">Active</option>
                                            <option value="suspended">Suspended</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </td>
                                    <td>
                                        <div className="date-cell">
                                            {formatDate(u.created_at)}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                className="action-btn view"
                                                title="View History"
                                                onClick={() => fetchUserDetail(u.id)}
                                                disabled={fetchingDetail}
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                className="action-btn delete"
                                                title="Deactivate Account"
                                                onClick={() => handleDeactivate(u.id)}
                                                disabled={isUpdating === u.id || u.role === 'superadmin'}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="no-results-cell">
                                    <div className="empty-state">
                                        <AlertCircle size={32} />
                                        <p>No users found matching filters</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                {totalPages > 1 && (
                    <div className="management-pagination">
                        <span className="pagination-info">Page {page} of {totalPages}</span>
                        <div className="pagination-controls">
                            <button
                                className="page-btn"
                                onClick={() => setPage(page - 1)}
                                disabled={page === 1}
                            >
                                Previous
                            </button>
                            <button
                                className="page-btn"
                                onClick={() => setPage(page + 1)}
                                disabled={page === totalPages}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {showDetailModal && selectedUser && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowDetailModal(false)}>
                    <div className="modal-content user-detail-modal">
                        <div className="modal-header">
                            <div className="modal-header-content">
                                <div className="modal-avatar-wrapper">
                                    <Avatar src={selectedUser.user.profile_image || selectedUser.user.profile_photo_url} name={selectedUser.user.name} />
                                    <span className={`status-indicator ${selectedUser.user.status?.toLowerCase()}`}></span>
                                </div>
                                <div>
                                    <h3>{selectedUser.user.name}</h3>
                                    <span className="modal-subtitle">{selectedUser.user.email}</span>
                                    <div className="modal-badges">
                                        {getRoleBadge(selectedUser.user.role)}
                                        <span className={`status-tag ${selectedUser.user.status?.toLowerCase()}`}>{selectedUser.user.status}</span>
                                    </div>
                                </div>
                            </div>
                            <button className="close-btn" onClick={() => setShowDetailModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Account Statistics Banner */}
                        {selectedUser.accountStats && (
                            <div className="stats-banner">
                                <div className="stat-mini">
                                    <BarChart3 size={16} />
                                    <div>
                                        <span className="stat-number">{selectedUser.accountStats.totalBookings}</span>
                                        <span className="stat-text">Bookings</span>
                                    </div>
                                </div>
                                <div className="stat-mini">
                                    <CheckCircle size={16} />
                                    <div>
                                        <span className="stat-number">{selectedUser.accountStats.completedSessions}</span>
                                        <span className="stat-text">Sessions</span>
                                    </div>
                                </div>
                                <div className="stat-mini">
                                    <FileText size={16} />
                                    <div>
                                        <span className="stat-number">{selectedUser.accountStats.openTickets}</span>
                                        <span className="stat-text">Open Tickets</span>
                                    </div>
                                </div>
                                <div className="stat-mini">
                                    <Activity size={16} />
                                    <div>
                                        <span className="stat-number">{selectedUser.accountStats.totalActivityLogs}</span>
                                        <span className="stat-text">Activities</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="modal-body">
                            {/* Basic Information Section */}
                            <section className="detail-section">
                                <h4><UserIcon size={16} /> Basic Information</h4>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <label><UserIcon size={12} /> Full Name</label>
                                        <span>{selectedUser.user.name}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label><Mail size={12} /> Email Address</label>
                                        <span>{selectedUser.user.email}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label><Phone size={12} /> Phone</label>
                                        <span>{selectedUser.user.phone || 'Not provided'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label><Shield size={12} /> Role</label>
                                        {getRoleBadge(selectedUser.user.role)}
                                    </div>
                                </div>
                            </section>

                            {/* Account Metadata Section */}
                            <section className="detail-section">
                                <h4><Calendar size={16} /> Account Metadata</h4>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <label>Member Since</label>
                                        <span>{formatDateTime(selectedUser.user.created_at)}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Last Updated</label>
                                        <span>{selectedUser.user.updated_at ? formatDateTime(selectedUser.user.updated_at) : 'Never'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Last Login</label>
                                        <span>{selectedUser.user.last_login_at ? formatDateTime(selectedUser.user.last_login_at) : 'Never'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Email Verified</label>
                                        <span className={`verification-badge ${selectedUser.user.email_verified ? 'verified' : 'unverified'}`}>
                                            {selectedUser.user.email_verified ? '✓ Verified' : '✗ Not Verified'}
                                        </span>
                                    </div>
                                </div>
                            </section>

                            {/* Login History Section */}
                            <section className="detail-section">
                                <h4><LogIn size={16} /> Login History</h4>
                                {selectedUser.loginHistory && selectedUser.loginHistory.length > 0 ? (
                                    <div className="activity-list compact">
                                        {selectedUser.loginHistory.slice(0, 10).map((log: any, idx: number) => (
                                            <div key={log.id || idx} className="activity-item login-item">
                                                <div className="activity-icon">
                                                    <LogIn size={14} />
                                                </div>
                                                <div className="activity-details">
                                                    <span className="activity-action">{log.action?.replace(/_/g, ' ')}</span>
                                                    {log.metadata && (
                                                        <span className="activity-meta">
                                                            {(() => {
                                                                try {
                                                                    const meta = typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata;
                                                                    return meta.ip_address ? `IP: ${meta.ip_address}` : '';
                                                                } catch { return ''; }
                                                            })()}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="activity-time">{log.created_at ? formatDateTime(log.created_at) : ''}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="no-data">No login history available.</p>
                                )}
                            </section>

                            {/* Booking History Section */}
                            <section className="detail-section">
                                <h4><Briefcase size={16} /> Booking History (Connect Requests)</h4>
                                {selectedUser.bookings && selectedUser.bookings.length > 0 ? (
                                    <div className="table-scroll">
                                        <table className="mini-table">
                                            <thead>
                                                <tr>
                                                    <th>Ref ID</th>
                                                    <th>{selectedUser.user.role.toLowerCase() === 'expert' ? 'Customer' : 'Expert'}</th>
                                                    <th>Status</th>
                                                    <th>Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedUser.bookings.slice(0, 10).map((b: any) => (
                                                    <tr key={b.id}>
                                                        <td><code>{b.id?.substring(0, 8) || 'N/A'}</code></td>
                                                        <td>{selectedUser.user.role.toLowerCase() === 'expert' ? (b.customer_name || 'N/A') : (b.expert_name || 'N/A')}</td>
                                                        <td><span className={`status-tag ${b.status?.toLowerCase()}`}>{b.status}</span></td>
                                                        <td>{b.created_at ? formatDate(b.created_at) : 'N/A'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {selectedUser.bookings.length > 10 && (
                                            <p className="more-indicator">+ {selectedUser.bookings.length - 10} more bookings</p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="no-data">No booking history available.</p>
                                )}
                            </section>

                            {/* Session History Section */}
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
                                                {selectedUser.sessions.slice(0, 10).map((s: any) => (
                                                    <tr key={s.id}>
                                                        <td>{s.title || 'Session'}</td>
                                                        <td>{selectedUser.user.role.toLowerCase() === 'expert' ? (s.customer_name || 'N/A') : (s.expert_name || 'N/A')}</td>
                                                        <td>{s.scheduled_date ? formatDate(s.scheduled_date) : 'N/A'}</td>
                                                        <td><span className={`status-tag ${s.status?.toLowerCase()}`}>{s.status}</span></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {selectedUser.sessions.length > 10 && (
                                            <p className="more-indicator">+ {selectedUser.sessions.length - 10} more sessions</p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="no-data">No session history found.</p>
                                )}
                            </section>

                            {/* Tickets History Section */}
                            <section className="detail-section">
                                <h4><FileText size={16} /> Support Tickets</h4>
                                {selectedUser.tickets && selectedUser.tickets.length > 0 ? (
                                    <div className="table-scroll">
                                        <table className="mini-table">
                                            <thead>
                                                <tr>
                                                    <th>Subject</th>
                                                    <th>Priority</th>
                                                    <th>Status</th>
                                                    <th>Created</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedUser.tickets.slice(0, 10).map((t: any) => (
                                                    <tr key={t.id}>
                                                        <td>{t.subject || t.title || 'Ticket'}</td>
                                                        <td><span className={`priority-tag ${t.priority?.toLowerCase()}`}>{t.priority || 'Medium'}</span></td>
                                                        <td><span className={`status-tag ${t.status?.toLowerCase()}`}>{t.status}</span></td>
                                                        <td>{t.created_at ? formatDate(t.created_at) : 'N/A'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {selectedUser.tickets.length > 10 && (
                                            <p className="more-indicator">+ {selectedUser.tickets.length - 10} more tickets</p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="no-data">No support tickets found.</p>
                                )}
                            </section>

                            {/* Activity History Section */}
                            <section className="detail-section">
                                <h4><History size={16} /> Activity History</h4>
                                {selectedUser.activityLogs && selectedUser.activityLogs.length > 0 ? (
                                    <div className="activity-timeline">
                                        {selectedUser.activityLogs.slice(0, 20).map((log: any, idx: number) => (
                                            <div key={log.id || idx} className="timeline-item">
                                                <div className="timeline-dot"></div>
                                                <div className="timeline-content">
                                                    <span className="timeline-action">{log.action?.replace(/_/g, ' ')}</span>
                                                    {log.entity_type && <span className="timeline-entity">{log.entity_type}</span>}
                                                    <span className="timeline-time">{log.created_at ? formatDateTime(log.created_at) : ''}</span>
                                                </div>
                                            </div>
                                        ))}
                                        {selectedUser.activityLogs.length > 20 && (
                                            <p className="more-indicator">+ {selectedUser.activityLogs.length - 20} more activities</p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="no-data">No activity history available.</p>
                                )}
                            </section>

                            {/* Expert Application Section (if applicable) */}
                            {selectedUser.expertApplication && (
                                <section className="detail-section">
                                    <h4><Award size={16} /> Expert Application</h4>
                                    <div className="detail-grid">
                                        <div className="detail-item">
                                            <label>Application Status</label>
                                            <span className={`status-tag ${selectedUser.expertApplication.status?.toLowerCase()}`}>
                                                {selectedUser.expertApplication.status}
                                            </span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Applied On</label>
                                            <span>{selectedUser.expertApplication.created_at ? formatDateTime(selectedUser.expertApplication.created_at) : 'N/A'}</span>
                                        </div>
                                        {selectedUser.expertApplication.expertise && (
                                            <div className="detail-item full-width">
                                                <label>Expertise</label>
                                                <span>{selectedUser.expertApplication.expertise}</span>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="modal-footer">
                            <span className="fetch-timestamp">
                                Data fetched: {selectedUser.fetchedAt ? formatDateTime(selectedUser.fetchedAt) : 'Just now'}
                            </span>
                            <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .spin { animation: rotate 1s linear infinite; }
                @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .select-sm { padding: 2px 4px; font-size: 0.75rem; border-radius: 4px; }
                .no-results-cell { padding: var(--space-12) !important; text-align: center; }
                .empty-state { color: var(--text-muted); display: flex; flex-direction: column; align-items: center; gap: var(--space-3); }
                
                /* Modal Styles */
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 1rem; animation: fadeIn 0.2s ease-out; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .modal-content { background: var(--bg-primary, white); border-radius: 16px; width: 100%; max-width: 960px; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 50px rgba(0,0,0,0.25); animation: slideUp 0.3s ease-out; display: flex; flex-direction: column; }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                
                /* Modal Header */
                .modal-header { padding: 1.5rem; border-bottom: 1px solid var(--border-light, #eee); display: flex; justify-content: space-between; align-items: flex-start; background: linear-gradient(135deg, var(--primary-50, #eef2ff) 0%, var(--bg-primary, white) 100%); border-radius: 16px 16px 0 0; }
                .modal-header-content { display: flex; align-items: center; gap: 1rem; min-width: 0; flex: 1; }
                .modal-avatar-wrapper { position: relative; }
                .modal-avatar-wrapper .status-indicator { position: absolute; bottom: 2px; right: 2px; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; }
                .status-indicator.active { background: #10b981; }
                .status-indicator.inactive { background: #6b7280; }
                .status-indicator.suspended { background: #ef4444; }
                .modal-header-content > div:last-child { min-width: 0; flex: 1; }
                .modal-header-content h3 { margin: 0 0 0.25rem 0; font-size: 1.35rem; font-weight: 700; color: var(--text-primary, #333); }
                .modal-subtitle { font-size: 0.875rem; color: var(--text-secondary, #666); display: block; }
                .modal-badges { display: flex; gap: 0.5rem; margin-top: 0.5rem; flex-wrap: wrap; }
                .close-btn { background: var(--bg-tertiary, #f5f5f5); border: none; cursor: pointer; color: var(--text-secondary, #666); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0; }
                .close-btn:hover { background: var(--bg-surface-secondary, #eee); color: var(--text-primary, #333); transform: rotate(90deg); }
                
                /* Stats Banner */
                .stats-banner { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; padding: 1rem 1.5rem; background: var(--bg-tertiary, #f9fafb); border-bottom: 1px solid var(--border-light, #eee); }
                .stat-mini { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: var(--bg-primary, white); border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
                .stat-mini svg { color: var(--primary-500, #6366f1); flex-shrink: 0; }
                .stat-mini > div { display: flex; flex-direction: column; }
                .stat-number { font-size: 1.25rem; font-weight: 700; color: var(--text-primary, #333); line-height: 1; }
                .stat-text { font-size: 0.7rem; color: var(--text-tertiary, #888); text-transform: uppercase; letter-spacing: 0.5px; }
                
                /* Modal Body */
                .modal-body { padding: 1.5rem; flex: 1; overflow-y: auto; }
                .detail-section { margin-bottom: 2rem; }
                .detail-section:last-child { margin-bottom: 0; }
                .detail-section h4 { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; color: var(--primary-600, #6366f1); border-bottom: 2px solid var(--border-light, #f0f0f0); padding-bottom: 0.75rem; font-size: 1rem; font-weight: 600; }
                .detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; }
                .detail-item { min-width: 0; overflow: hidden; }
                .detail-item.full-width { grid-column: 1 / -1; }
                .detail-item label { display: flex; align-items: center; gap: 0.35rem; font-size: 0.7rem; color: var(--text-tertiary, #888); margin-bottom: 0.35rem; text-transform: uppercase; letter-spacing: 0.5px; }
                .detail-item label svg { opacity: 0.6; }
                .detail-item span { font-weight: 500; color: var(--text-primary, #333); display: block; word-break: break-word; overflow-wrap: break-word; }
                
                /* Verification Badge */
                .verification-badge { display: inline-flex; align-items: center; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
                .verification-badge.verified { background: #dcfce7; color: #166534; }
                .verification-badge.unverified { background: #fef3c7; color: #92400e; }
                
                /* Tables */
                .table-scroll { overflow-x: auto; border-radius: 8px; border: 1px solid var(--border-light, #eee); }
                .mini-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
                .mini-table th { text-align: left; padding: 0.75rem 1rem; background: var(--bg-surface-secondary, #f9fafb); border-bottom: 1px solid var(--border-light, #eee); font-weight: 600; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-secondary, #666); }
                .mini-table td { padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-light, #eee); }
                .mini-table tr:last-child td { border-bottom: none; }
                .mini-table tr:hover { background: var(--bg-tertiary, #f9fafb); }
                .mini-table code { background: var(--bg-tertiary, #f3f4f6); padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.75rem; font-family: monospace; }
                .more-indicator { text-align: center; color: var(--text-tertiary, #888); font-size: 0.8rem; padding: 0.75rem; margin: 0; background: var(--bg-tertiary, #f9fafb); border-top: 1px solid var(--border-light, #eee); }
                
                /* Status Tags */
                .status-tag { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; text-transform: capitalize; font-weight: 500; }
                .status-tag.accepted, .status-tag.completed, .status-tag.active, .status-tag.approved { background: #dcfce7; color: #166534; }
                .status-tag.pending, .status-tag.pending_verification, .status-tag.open { background: #fef3c7; color: #92400e; }
                .status-tag.rejected, .status-tag.inactive, .status-tag.suspended, .status-tag.closed { background: #fee2e2; color: #991b1b; }
                .status-tag.scheduled, .status-tag.in_progress { background: #dbeafe; color: #1e40af; }
                
                /* Priority Tags */
                .priority-tag { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; text-transform: capitalize; font-weight: 500; }
                .priority-tag.high, .priority-tag.urgent { background: #fee2e2; color: #991b1b; }
                .priority-tag.medium { background: #fef3c7; color: #92400e; }
                .priority-tag.low { background: #dcfce7; color: #166534; }
                
                /* Activity List */
                .activity-list { display: flex; flex-direction: column; gap: 0.5rem; }
                .activity-list.compact { gap: 0.35rem; }
                .activity-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; background: var(--bg-tertiary, #f9fafb); border-radius: 8px; transition: background 0.2s; }
                .activity-item:hover { background: var(--bg-surface-secondary, #f3f4f6); }
                .activity-item.login-item { border-left: 3px solid var(--primary-400, #818cf8); }
                .activity-icon { width: 28px; height: 28px; border-radius: 50%; background: var(--primary-100, #e0e7ff); display: flex; align-items: center; justify-content: center; color: var(--primary-600, #4f46e5); flex-shrink: 0; }
                .activity-details { flex: 1; min-width: 0; }
                .activity-action { font-size: 0.875rem; color: var(--text-primary, #333); text-transform: capitalize; display: block; }
                .activity-meta { font-size: 0.75rem; color: var(--text-tertiary, #888); display: block; }
                .activity-time { font-size: 0.75rem; color: var(--text-tertiary, #888); flex-shrink: 0; }
                
                /* Activity Timeline */
                .activity-timeline { position: relative; padding-left: 1.5rem; }
                .activity-timeline::before { content: ''; position: absolute; left: 5px; top: 0; bottom: 0; width: 2px; background: var(--border-light, #e5e7eb); }
                .timeline-item { position: relative; padding: 0.75rem 0; display: flex; align-items: flex-start; gap: 1rem; }
                .timeline-dot { position: absolute; left: -1.5rem; top: 1rem; width: 12px; height: 12px; border-radius: 50%; background: var(--primary-500, #6366f1); border: 2px solid white; box-shadow: 0 0 0 2px var(--primary-200, #c7d2fe); }
                .timeline-content { flex: 1; background: var(--bg-tertiary, #f9fafb); padding: 0.75rem 1rem; border-radius: 8px; }
                .timeline-action { font-size: 0.875rem; color: var(--text-primary, #333); text-transform: capitalize; font-weight: 500; }
                .timeline-entity { font-size: 0.7rem; background: var(--primary-100, #e0e7ff); color: var(--primary-700, #4338ca); padding: 0.1rem 0.5rem; border-radius: 4px; margin-left: 0.5rem; text-transform: uppercase; }
                .timeline-time { display: block; font-size: 0.75rem; color: var(--text-tertiary, #888); margin-top: 0.25rem; }
                
                /* No Data */
                .no-data { text-align: center; color: var(--text-muted, #888); font-style: italic; padding: 1.5rem; background: var(--bg-tertiary, #f9fafb); border-radius: 8px; font-size: 0.875rem; }
                
                /* Modal Footer */
                .modal-footer { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-top: 1px solid var(--border-light, #eee); background: var(--bg-tertiary, #f9fafb); border-radius: 0 0 16px 16px; }
                .fetch-timestamp { font-size: 0.75rem; color: var(--text-tertiary, #888); }
                
                /* Action buttons visibility fix */
                .action-btn { display: inline-flex !important; align-items: center !important; justify-content: center !important; width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border-light, #e5e7eb); background: var(--bg-primary, white); cursor: pointer; transition: all 0.2s; }
                .action-btn svg { display: block !important; flex-shrink: 0; }
                .action-btn.view { color: var(--primary-600, #6366f1); }
                .action-btn.view:hover { background: var(--primary-50, #eef2ff); border-color: var(--primary-200, #c7d2fe); }
                .action-btn.delete { color: var(--text-secondary, #666); }
                .action-btn.delete:hover { background: var(--danger-50, #fef2f2); color: var(--danger-600, #dc2626); border-color: var(--danger-200, #fecaca); }
                .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                
                /* Responsive */
                @media (max-width: 768px) {
                    .stats-banner { grid-template-columns: repeat(2, 1fr); }
                    .detail-grid { grid-template-columns: 1fr; }
                    .modal-content { max-height: 95vh; border-radius: 12px; }
                }
                
                /* Dark mode support */
                [data-theme="dark"] .modal-content { background: var(--bg-secondary); }
                [data-theme="dark"] .modal-header { background: linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%); }
                [data-theme="dark"] .stats-banner { background: var(--bg-tertiary); }
                [data-theme="dark"] .stat-mini { background: var(--bg-secondary); }
                [data-theme="dark"] .mini-table th { background: var(--bg-tertiary); }
                [data-theme="dark"] .mini-table tr:hover { background: var(--bg-tertiary); }
                [data-theme="dark"] .detail-item span { color: var(--text-primary); }
                [data-theme="dark"] .activity-item { background: var(--bg-tertiary); }
                [data-theme="dark"] .timeline-content { background: var(--bg-tertiary); }
                [data-theme="dark"] .modal-footer { background: var(--bg-tertiary); }
            `}</style>
        </div>
    );
};

export default UserManagement;
