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
    X
} from 'lucide-react';
import { adminUserApi } from '../../services/api';
import Avatar from '../../components/common/Avatar';
import { useAuth } from '../../context/AuthContext';
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
    last_login_at?: string;
}

interface UserDetail {
    user: UserData;
    profile: any;
    bookings: any[];
    sessions: any[];
    expertApplication: any;
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
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://backend.proveloce.com'}/api/admin/users/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            if (data.success) {
                setSelectedUser(data.data);
                setShowDetailModal(true);
            } else {
                showGlobalError('Fetch Failed', data.error || 'Failed to fetch user details');
            }
        } catch (err: any) {
            showGlobalError('Fetch Failed', 'An error occurred while fetching details');
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
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="">All Roles</option>
                        <option value="superadmin">Superadmin</option>
                        <option value="admin">Admin</option>
                        <option value="Expert">Expert</option>
                        <option value="Customer">Customer</option>
                    </select>
                    <select
                        className="filter-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="inactive">Inactive</option>
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
                                            {new Date(u.created_at).toLocaleDateString()}
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
                <div className="modal-overlay">
                    <div className="modal-content user-detail-modal">
                        <div className="modal-header">
                            <h3>User History & Details</h3>
                            <button className="close-btn" onClick={() => setShowDetailModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <section className="detail-section">
                                <h4>Profile Information</h4>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <label>Full Name</label>
                                        <span>{selectedUser.user.name}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Email Address</label>
                                        <span>{selectedUser.user.email}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Phone</label>
                                        <span>{selectedUser.user.phone || 'N/A'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Role</label>
                                        <span>{selectedUser.user.role}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Member Since</label>
                                        <span>{new Date(selectedUser.user.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </section>

                            <section className="detail-section">
                                <h4>Booking History (Connect Requests)</h4>
                                {selectedUser.bookings.length > 0 ? (
                                    <table className="mini-table">
                                        <thead>
                                            <tr>
                                                <th>Ref ID</th>
                                                <th>{selectedUser.user.role === 'Expert' ? 'Customer' : 'Expert'}</th>
                                                <th>Status</th>
                                                <th>Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedUser.bookings.map((b: any) => (
                                                <tr key={b.id}>
                                                    <td>{b.id.substring(0, 8)}...</td>
                                                    <td>{selectedUser.user.role === 'Expert' ? b.customer_name : b.expert_name}</td>
                                                    <td><span className={`status-tag ${b.status}`}>{b.status}</span></td>
                                                    <td>{new Date(b.created_at).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p className="no-data">No booking history available.</p>
                                )}
                            </section>

                            <section className="detail-section">
                                <h4>Session History (Meetings)</h4>
                                {selectedUser.sessions.length > 0 ? (
                                    <table className="mini-table">
                                        <thead>
                                            <tr>
                                                <th>Meeting Name</th>
                                                <th>Expert</th>
                                                <th>Date</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedUser.sessions.map((s: any) => (
                                                <tr key={s.id}>
                                                    <td>{s.title}</td>
                                                    <td>{s.expert_name}</td>
                                                    <td>{new Date(s.scheduled_date).toLocaleDateString()}</td>
                                                    <td><span className={`status-tag ${s.status}`}>{s.status}</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p className="no-data">No session history found.</p>
                                )}
                            </section>
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
                
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 2rem; }
                .modal-content { background: white; border-radius: 12px; width: 100%; max-width: 800px; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
                .modal-header { padding: 1.5rem; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
                .close-btn { background: none; border: none; cursor: pointer; color: #666; }
                .modal-body { padding: 1.5rem; }
                .detail-section { margin-bottom: 2rem; }
                .detail-section h4 { margin-bottom: 1rem; color: var(--primary-color); border-bottom: 2px solid #f0f0f0; padding-bottom: 0.5rem; }
                .detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; }
                .detail-item label { display: block; font-size: 0.75rem; color: #888; margin-bottom: 0.25rem; text-transform: uppercase; }
                .detail-item span { font-weight: 500; color: #333; }
                .mini-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
                .mini-table th { text-align: left; padding: 0.75rem; background: #f9fafb; border-bottom: 1px solid #eee; }
                .mini-table td { padding: 0.75rem; border-bottom: 1px solid #eee; }
                .status-tag { padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; text-transform: capitalize; }
                .status-tag.accepted, .status-tag.completed { background: #e6fcf5; color: #087f5b; }
                .status-tag.pending { background: #fff9db; color: #f08c00; }
                .status-tag.rejected { background: #fff5f5; color: #fa5252; }
                .no-data { text-align: center; color: #888; font-style: italic; padding: 1rem; }
                .action-btn.view { color: var(--primary-color); }
                .action-btn.view:hover { background: var(--primary-light); }
            `}</style>
        </div>
    );
};

export default UserManagement;
