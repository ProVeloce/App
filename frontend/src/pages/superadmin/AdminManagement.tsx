import React, { useState, useEffect } from 'react';
import { Shield, Plus, Search, Edit2, Trash2, X, Check, Users, UserCog } from 'lucide-react';
import { adminApi, User } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import './AdminManagement.css';

interface UserFormData {
    name: string;
    email: string;
    phone: string;
    role: string;
    status: string;
}

const AdminManagement: React.FC = () => {
    const { success, error } = useToast();
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState<UserFormData>({
        name: '', email: '', phone: '', role: 'admin', status: 'active'
    });

    useEffect(() => {
        fetchUsers();
    }, [roleFilter, pagination.page]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params: Record<string, any> = { page: pagination.page, limit: pagination.limit };
            if (roleFilter !== 'all') params.role = roleFilter;
            if (search) params.search = search;

            const response = await adminApi.getUsers(params);
            if (response.data?.success && response.data?.data) {
                setUsers(response.data.data.users || []);
                if (response.data.data.pagination) {
                    setPagination(prev => ({ ...prev, ...response.data.data!.pagination }));
                }
            }
        } catch (err: any) {
            error(err.response?.data?.error || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchUsers();
    };

    const openAddModal = () => {
        setFormData({ name: '', email: '', phone: '', role: 'admin', status: 'active' });
        setShowAddModal(true);
    };

    const openEditModal = (user: User) => {
        setSelectedUser(user);
        setFormData({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            role: user.role?.toLowerCase() || 'customer',
            status: user.status?.toLowerCase() || 'active'
        });
        setShowEditModal(true);
    };

    const openDeleteModal = (user: User) => {
        setSelectedUser(user);
        setShowDeleteModal(true);
    };

    const handleCreate = async () => {
        if (!formData.name || !formData.email) {
            error('Name and email are required');
            return;
        }
        setSubmitting(true);
        try {
            await adminApi.createUser(formData);
            success('User created successfully');
            setShowAddModal(false);
            fetchUsers();
        } catch (err: any) {
            error(err.response?.data?.error || 'Failed to create user');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async () => {
        if (!selectedUser) return;
        setSubmitting(true);
        try {
            await adminApi.updateUser(selectedUser.id, formData);
            success('User updated successfully');
            setShowEditModal(false);
            fetchUsers();
        } catch (err: any) {
            error(err.response?.data?.error || 'Failed to update user');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedUser) return;
        setSubmitting(true);
        try {
            await adminApi.deleteUser(selectedUser.id);
            success('User deactivated successfully');
            setShowDeleteModal(false);
            fetchUsers();
        } catch (err: any) {
            error(err.response?.data?.error || 'Failed to delete user');
        } finally {
            setSubmitting(false);
        }
    };

    const getRoleBadgeClass = (role: string) => {
        const r = role?.toLowerCase();
        if (r === 'superadmin') return 'badge-purple';
        if (r === 'admin') return 'badge-blue';
        if (r === 'analyst') return 'badge-green';
        if (r === 'expert') return 'badge-orange';
        return 'badge-gray';
    };

    const getStatusBadgeClass = (status: string) => {
        const s = status?.toLowerCase();
        if (s === 'active') return 'status-active';
        if (s === 'pending_verification') return 'status-pending';
        if (s === 'deactivated') return 'status-inactive';
        return 'status-default';
    };

    return (
        <div className="admin-management-page">
            <div className="page-header">
                <div>
                    <h1><Shield size={24} /> Admin Management</h1>
                    <p>Manage admin, analyst, and user accounts</p>
                </div>
                <button className="btn btn-primary" onClick={openAddModal}>
                    <Plus size={18} /> Add User
                </button>
            </div>

            {/* Filters */}
            <div className="filters-section">
                <div className="role-tabs">
                    {['all', 'admin', 'analyst', 'expert', 'customer'].map(role => (
                        <button
                            key={role}
                            className={`tab-btn ${roleFilter === role ? 'active' : ''}`}
                            onClick={() => { setRoleFilter(role); setPagination(p => ({ ...p, page: 1 })); }}
                        >
                            {role === 'all' ? 'All Users' : role.charAt(0).toUpperCase() + role.slice(1)}
                        </button>
                    ))}
                </div>
                <form className="search-form" onSubmit={handleSearch}>
                    <div className="search-input-wrapper">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn btn-secondary">Search</button>
                </form>
            </div>

            {/* Users Table */}
            <div className="users-table-container">
                {loading ? (
                    <div className="loading-state"><div className="spinner" /> Loading users...</div>
                ) : users.length === 0 ? (
                    <div className="empty-state">
                        <Users size={48} />
                        <h3>No users found</h3>
                        <p>Try adjusting your filters or add a new user</p>
                    </div>
                ) : (
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td className="user-name">{user.name || '-'}</td>
                                    <td>{user.email}</td>
                                    <td><span className={`badge ${getRoleBadgeClass(user.role)}`}>{user.role}</span></td>
                                    <td><span className={`status-badge ${getStatusBadgeClass(user.status)}`}>{user.status}</span></td>
                                    <td>{(user.createdAt || (user as any).created_at) ? new Date((user.createdAt || (user as any).created_at)).toLocaleDateString() : '-'}</td>
                                    <td className="actions">
                                        <button className="icon-btn" title="Edit" onClick={() => openEditModal(user)}><Edit2 size={16} /></button>
                                        <button className="icon-btn danger" title="Delete" onClick={() => openDeleteModal(user)}><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="pagination">
                    <button onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} disabled={pagination.page <= 1}>Prev</button>
                    <span>Page {pagination.page} of {pagination.totalPages}</span>
                    <button onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} disabled={pagination.page >= pagination.totalPages}>Next</button>
                </div>
            )}

            {/* Add Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2><UserCog size={20} /> Add New User</h2>
                            <button className="close-btn" onClick={() => setShowAddModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Name *</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Full name" />
                            </div>
                            <div className="form-group">
                                <label>Email *</label>
                                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="email@example.com" />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 98765 43210" />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Role</label>
                                    <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                        <option value="customer">Customer</option>
                                        <option value="expert">Expert</option>
                                        {currentUser?.role === 'SUPERADMIN' && (
                                            <>
                                                <option value="analyst">Analyst</option>
                                                <option value="admin">Admin</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                        <option value="active">Active</option>
                                        <option value="pending_verification">Pending</option>
                                        <option value="suspended">Suspended</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleCreate} disabled={submitting}>
                                {submitting ? 'Creating...' : 'Create User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedUser && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2><Edit2 size={20} /> Edit User</h2>
                            <button className="close-btn" onClick={() => setShowEditModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Name</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Role</label>
                                    <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                        <option value="customer">Customer</option>
                                        <option value="expert">Expert</option>
                                        {currentUser?.role === 'SUPERADMIN' && (
                                            <>
                                                <option value="analyst">Analyst</option>
                                                <option value="admin">Admin</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                        <option value="active">Active</option>
                                        <option value="pending_verification">Pending</option>
                                        <option value="suspended">Suspended</option>
                                        <option value="deactivated">Deactivated</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleUpdate} disabled={submitting}>
                                {submitting ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedUser && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2><Trash2 size={20} /> Confirm Delete</h2>
                            <button className="close-btn" onClick={() => setShowDeleteModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to deactivate <strong>{selectedUser.name || selectedUser.email}</strong>?</p>
                            <p className="text-muted">This action will set the user's status to "deactivated".</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                            <button className="btn btn-danger" onClick={handleDelete} disabled={submitting}>
                                {submitting ? 'Deleting...' : 'Deactivate User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminManagement;
