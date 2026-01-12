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
    CheckCircle
} from 'lucide-react';
import { adminUserApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { showGlobalError, showGlobalSuccess } from '../../context/ErrorContext';
import './UserManagement.css';

interface UserData {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    created_at: string;
    last_login_at?: string;
}

interface Stats {
    totalUsers: number;
    admins: number;
    experts: number;
    pendingUsers: number;
}

const UserManagement: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<UserData[]>([]);
    const [stats, setStats] = useState<Stats>({ totalUsers: 0, admins: 0, experts: 0, pendingUsers: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isUpdating, setIsUpdating] = useState<string | null>(null);

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
        if (!window.confirm('Are you sure you want to deactivate this user?')) return;

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
                                                {u.name.charAt(0).toUpperCase()}
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

            <style>{`
                .spin { animation: rotate 1s linear infinite; }
                @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .select-sm { padding: 2px 4px; font-size: 0.75rem; border-radius: 4px; }
                .no-results-cell { padding: var(--space-12) !important; text-align: center; }
                .empty-state { color: var(--text-muted); display: flex; flex-direction: column; align-items: center; gap: var(--space-3); }
            `}</style>
        </div>
    );
};

export default UserManagement;
