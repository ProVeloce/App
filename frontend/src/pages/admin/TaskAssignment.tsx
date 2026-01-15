import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
    Briefcase, Plus, X, Calendar, User, Clock, CheckCircle, Loader, 
    Search, ChevronDown, RefreshCw, Mail, Shield, AlertCircle, Edit2, Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getAccessToken } from '../../services/api';
import ConfirmModal from '../../components/common/ConfirmModal';
import './TaskAssignment.css';

interface Task {
    id: string;
    title: string;
    description: string;
    assigned_to: string | null;
    assigned_user_name: string | null;
    assigned_user_email?: string | null;
    due_date: string | null;
    status: 'Pending' | 'InProgress' | 'Completed';
    org_id?: string;
    created_by: string;
    created_by_name?: string | null;
    created_at: string;
    updated_at: string;
}

interface UserData {
    id: string;
    name: string;
    email: string;
    role: string;
    status?: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://backend.proveloce.com';

// Searchable Expert Dropdown Component
interface ExpertSelectorProps {
    experts: UserData[];
    selectedId: string;
    onSelect: (id: string) => void;
    placeholder?: string;
    loading?: boolean;
    disabled?: boolean;
}

const ExpertSelector: React.FC<ExpertSelectorProps> = ({ 
    experts, 
    selectedId, 
    onSelect, 
    placeholder = "Select Expert",
    loading = false,
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close on escape
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
                setSearchQuery('');
            }
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen]);

    // Filter experts based on search
    const filteredExperts = useMemo(() => {
        if (!searchQuery.trim()) return experts;
        const query = searchQuery.toLowerCase();
        return experts.filter(expert => 
            expert.name?.toLowerCase().includes(query) ||
            expert.email?.toLowerCase().includes(query) ||
            expert.role?.toLowerCase().includes(query)
        );
    }, [experts, searchQuery]);

    const selectedExpert = useMemo(() => 
        experts.find(e => e.id === selectedId), 
        [experts, selectedId]
    );

    const handleToggle = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;
        
        setIsOpen(prev => {
            if (!prev) {
                // Opening - focus search after animation
                setTimeout(() => inputRef.current?.focus(), 50);
            }
            return !prev;
        });
    }, [disabled]);

    const handleSelect = useCallback((id: string) => {
        onSelect(id);
        setIsOpen(false);
        setSearchQuery('');
    }, [onSelect]);

    const handleClear = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onSelect('');
        setSearchQuery('');
    }, [onSelect]);

    return (
        <div className={`expert-selector ${disabled ? 'disabled' : ''}`} ref={dropdownRef}>
            <button 
                type="button"
                className={`expert-selector-trigger ${isOpen ? 'open' : ''} ${selectedId ? 'has-value' : ''}`}
                onClick={handleToggle}
                disabled={disabled}
            >
                {loading ? (
                    <span className="selector-placeholder">
                        <Loader size={14} className="spin" /> Loading...
                    </span>
                ) : selectedExpert ? (
                    <span className="selected-expert">
                        <User size={14} />
                        <span className="expert-name">{selectedExpert.name}</span>
                    </span>
                ) : (
                    <span className="selector-placeholder">
                        <User size={14} />
                        {placeholder}
                    </span>
                )}
                <div className="selector-actions">
                    {selectedId && !disabled && (
                        <span className="clear-btn" onClick={handleClear} title="Clear selection">
                            <X size={14} />
                        </span>
                    )}
                    <ChevronDown size={16} className={`chevron ${isOpen ? 'rotated' : ''}`} />
                </div>
            </button>

            {isOpen && !disabled && (
                <div className="expert-dropdown" onClick={(e) => e.stopPropagation()}>
                    <div className="dropdown-search">
                        <Search size={16} />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search by name, email, or role..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    
                    <div className="dropdown-list">
                        <button 
                            type="button"
                            className={`dropdown-item unassign ${!selectedId ? 'selected' : ''}`}
                            onClick={() => handleSelect('')}
                        >
                            <User size={14} />
                            <span>Unassigned</span>
                        </button>
                        
                        {filteredExperts.length === 0 ? (
                            <div className="dropdown-empty">
                                <Search size={20} />
                                <span>No experts found</span>
                            </div>
                        ) : (
                            filteredExperts.map(expert => (
                                <button
                                    key={expert.id}
                                    type="button"
                                    className={`dropdown-item ${expert.id === selectedId ? 'selected' : ''}`}
                                    onClick={() => handleSelect(expert.id)}
                                >
                                    <div className="expert-avatar">
                                        {expert.name?.charAt(0)?.toUpperCase() || 'E'}
                                    </div>
                                    <div className="expert-info">
                                        <span className="expert-name">{expert.name || 'Unnamed Expert'}</span>
                                        <span className="expert-email">
                                            <Mail size={10} /> {expert.email}
                                        </span>
                                    </div>
                                    <span className={`expert-role-badge ${expert.role?.toLowerCase()}`}>
                                        <Shield size={10} />
                                        {expert.role}
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                    
                    <div className="dropdown-footer">
                        Showing {filteredExperts.length} of {experts.length} experts
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper function to safely parse API responses
const safeParseResponse = async (response: Response): Promise<{ ok: boolean; data: any; error?: string }> => {
    const contentType = response.headers.get('content-type');
    
    // Check if response is JSON
    if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        
        if (response.status === 401 || response.status === 403) {
            return { ok: false, data: null, error: 'Authentication failed. Please log in again.' };
        }
        if (response.ok) {
            return { ok: true, data: { success: true } };
        }
        return { ok: false, data: null, error: 'Server returned an invalid response.' };
    }
    
    try {
        const data = await response.json();
        return { ok: response.ok, data };
    } catch (err) {
        console.error('JSON parse error:', err);
        return { ok: false, data: null, error: 'Failed to parse server response.' };
    }
};

const TaskAssignment: React.FC = () => {
    const { user } = useAuth();
    const { success, error } = useToast();
    const token = getAccessToken();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [assignableUsers, setAssignableUsers] = useState<UserData[]>([]);
    const [loadingExperts, setLoadingExperts] = useState(false);
    const [updatingTask, setUpdatingTask] = useState<string | null>(null);

    // Form state for Create
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [dueDate, setDueDate] = useState('');

    // Edit modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editAssignedTo, setEditAssignedTo] = useState('');
    const [editDueDate, setEditDueDate] = useState('');
    const [editStatus, setEditStatus] = useState<'Pending' | 'InProgress' | 'Completed'>('Pending');

    // Delete modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingTask, setDeletingTask] = useState<Task | null>(null);
    const [deleting, setDeleting] = useState(false);

    const userRole = user?.role?.toUpperCase() || '';
    const canCreateTask = userRole === 'ADMIN' || userRole === 'SUPERADMIN';

    // Fetch tasks
    const fetchTasks = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/tasks`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                const taskList = data.data?.tasks || [];
                setTasks(taskList);
            } else {
                error(data.error || 'Failed to fetch tasks');
            }
        } catch (err) {
            console.error('Failed to fetch tasks:', err);
            error('Failed to fetch tasks');
        } finally {
            setLoading(false);
        }
    }, [token, error]);

    // Fetch experts
    const fetchAssignableUsers = useCallback(async () => {
        setLoadingExperts(true);
        try {
            const response = await fetch(`${API_BASE}/api/users?roles=EXPERT`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            
            if (data.success) {
                let users: UserData[] = [];
                
                // Handle different response structures
                if (data.data?.data && Array.isArray(data.data.data)) {
                    users = data.data.data;
                } else if (data.data?.users && Array.isArray(data.data.users)) {
                    users = data.data.users;
                } else if (Array.isArray(data.data)) {
                    users = data.data;
                }
                
                // Filter active users only
                const activeExperts = users.filter(u => 
                    u.status !== 'inactive' && u.status !== 'suspended'
                );
                
                setAssignableUsers(activeExperts);
            }
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoadingExperts(false);
        }
    }, [token]);

    useEffect(() => {
        fetchTasks();
        if (canCreateTask) {
            fetchAssignableUsers();
        }
    }, [fetchTasks, fetchAssignableUsers, canCreateTask]);

    // Create task
    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !description.trim()) {
            error('Title and description are required');
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(`${API_BASE}/api/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim(),
                    assignedTo: assignedTo || null,
                    dueDate: dueDate || null
                })
            });

            const data = await response.json();
            if (data.success) {
                const expertName = data.data?.task?.assigned_user_name || 
                    assignableUsers.find(u => u.id === assignedTo)?.name;
                success(
                    assignedTo 
                        ? `Task created and assigned to ${expertName}` 
                        : 'Task created successfully'
                );
                setShowModal(false);
                resetForm();
                
                // Add the new task to state if returned by server
                if (data.data?.task) {
                    setTasks(prev => [data.data.task, ...prev]);
                } else {
                    // Fallback: fetch all tasks
                    await fetchTasks();
                }
            } else {
                error(data.error || 'Failed to create task');
            }
        } catch (err: any) {
            console.error('Create task error:', err);
            error('Failed to create task: ' + (err?.message || 'Unknown error'));
        } finally {
            setSubmitting(false);
        }
    };

    // Update status
    const handleUpdateStatus = async (taskId: string, newStatus: string) => {
        setUpdatingTask(taskId);
        try {
            const response = await fetch(`${API_BASE}/api/tasks/${taskId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            const { ok, data, error: parseError } = await safeParseResponse(response);
            if (parseError) {
                error(parseError);
                return;
            }
            
            if (data?.success) {
                success('Task status updated');
                // Update local state with response or fallback
                setTasks(prev => prev.map(t => {
                    if (t.id === taskId) {
                        if (data.data?.task) {
                            return data.data.task;
                        }
                        return { ...t, status: newStatus as Task['status'] };
                    }
                    return t;
                }));
            } else {
                error(data?.error || 'Failed to update task');
            }
        } catch (err: any) {
            console.error('Status update error:', err);
            error('Failed to update task: ' + (err?.message || 'Unknown error'));
        } finally {
            setUpdatingTask(null);
        }
    };

    // Assign task
    const handleAssignTask = async (taskId: string, expertId: string) => {
        setUpdatingTask(taskId);
        try {
            const response = await fetch(`${API_BASE}/api/tasks/${taskId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ assignedTo: expertId || null })
            });

            const { ok, data, error: parseError } = await safeParseResponse(response);
            if (parseError) {
                error(parseError);
                return;
            }
            
            if (data?.success) {
                // Get expert details from various sources
                const serverExpert = data.data?.task?.assigned_user_name;
                const localExpert = assignableUsers.find(u => u.id === expertId);
                const expertName = serverExpert || localExpert?.name || null;
                const expertEmail = data.data?.task?.assigned_user_email || localExpert?.email || null;
                
                success(expertId ? `Task assigned to ${expertName || 'expert'}` : 'Task unassigned');
                
                // Update local state with response data or fallback
                setTasks(prev => prev.map(t => {
                    if (t.id === taskId) {
                        if (data.data?.task) {
                            // Use server response if available - merge with existing data
                            return {
                                ...t,
                                ...data.data.task,
                                // Ensure these are set even if server response is incomplete
                                assigned_to: data.data.task.assigned_to || expertId || null,
                                assigned_user_name: data.data.task.assigned_user_name || expertName || null,
                                assigned_user_email: data.data.task.assigned_user_email || expertEmail || null
                            };
                        }
                        // Fallback to local update
                        return {
                            ...t,
                            assigned_to: expertId || null,
                            assigned_user_name: expertName || null,
                            assigned_user_email: expertEmail || null
                        };
                    }
                    return t;
                }));
            } else {
                error(data?.error || 'Failed to assign task');
            }
        } catch (err: any) {
            console.error('Assignment error:', err);
            error('Failed to assign task: ' + (err?.message || 'Unknown error'));
        } finally {
            setUpdatingTask(null);
        }
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setAssignedTo('');
        setDueDate('');
    };

    // Open Edit Modal
    const openEditModal = (task: Task) => {
        setEditingTask(task);
        setEditTitle(task.title);
        setEditDescription(task.description || '');
        setEditAssignedTo(task.assigned_to || '');
        setEditDueDate(task.due_date ? task.due_date.split('T')[0] : '');
        setEditStatus(task.status);
        setShowEditModal(true);
    };

    // Close Edit Modal
    const closeEditModal = () => {
        setShowEditModal(false);
        setEditingTask(null);
        setEditTitle('');
        setEditDescription('');
        setEditAssignedTo('');
        setEditDueDate('');
        setEditStatus('Pending');
    };

    // Handle Edit Submit
    const handleEditTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTask) return;
        if (!editTitle.trim()) {
            error('Title is required');
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(`${API_BASE}/api/tasks/${editingTask.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: editTitle.trim(),
                    description: editDescription.trim(),
                    assignedTo: editAssignedTo || null,
                    dueDate: editDueDate || null,
                    status: editStatus
                })
            });

            const data = await response.json();
            if (data.success) {
                success('Task updated successfully');
                // Update local state with response data
                setTasks(prev => prev.map(t => {
                    if (t.id === editingTask.id) {
                        if (data.data?.task) {
                            return data.data.task;
                        }
                        return {
                            ...t,
                            title: editTitle.trim(),
                            description: editDescription.trim(),
                            assigned_to: editAssignedTo || null,
                            due_date: editDueDate || null,
                            status: editStatus
                        };
                    }
                    return t;
                }));
                closeEditModal();
            } else {
                error(data.error || 'Failed to update task');
            }
        } catch (err: any) {
            console.error('Edit task error:', err);
            error('Failed to update task: ' + (err?.message || 'Unknown error'));
        } finally {
            setSubmitting(false);
        }
    };

    // Open Delete Confirmation
    const openDeleteModal = (task: Task) => {
        setDeletingTask(task);
        setShowDeleteModal(true);
    };

    // Close Delete Modal
    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setDeletingTask(null);
    };

    // Handle Delete
    const handleDeleteTask = async () => {
        if (!deletingTask) return;

        setDeleting(true);
        try {
            const response = await fetch(`${API_BASE}/api/tasks/${deletingTask.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            });

            // Check if response is JSON before parsing
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                // Response is not JSON - might be Cloudflare Access page or other HTML
                const text = await response.text();
                console.error('Non-JSON response received:', text.substring(0, 200));
                
                if (response.status === 401 || response.status === 403) {
                    error('Authentication failed. Please log in again.');
                } else if (response.ok) {
                    // DELETE might return empty response on success
                    success('Task deleted successfully');
                    setTasks(prev => prev.filter(t => t.id !== deletingTask.id));
                    closeDeleteModal();
                } else {
                    error('Server error. Please try again.');
                }
                return;
            }

            const data = await response.json();
            if (data.success) {
                success('Task deleted successfully');
                // Remove from local state
                setTasks(prev => prev.filter(t => t.id !== deletingTask.id));
                closeDeleteModal();
            } else {
                error(data.error || 'Failed to delete task');
            }
        } catch (err: any) {
            console.error('Delete task error:', err);
            // Check if it's a JSON parsing error
            if (err.message?.includes('JSON')) {
                error('Server returned an invalid response. Please try again.');
            } else {
                error('Failed to delete task: ' + (err?.message || 'Unknown error'));
            }
        } finally {
            setDeleting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
            Pending: { color: 'status-pending', icon: <Clock size={14} /> },
            InProgress: { color: 'status-progress', icon: <Loader size={14} /> },
            Completed: { color: 'status-completed', icon: <CheckCircle size={14} /> }
        };
        const config = statusConfig[status] || statusConfig.Pending;
        return (
            <span className={`status-badge ${config.color}`}>
                {config.icon}
                {status === 'InProgress' ? 'In Progress' : status}
            </span>
        );
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'No due date';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    const handleRefresh = async () => {
        await Promise.all([fetchTasks(), fetchAssignableUsers()]);
        success('Data refreshed');
    };

    return (
        <div className="task-assignment-page">
            <div className="page-header">
                <div>
                    <h1><Briefcase size={28} /> Task Assignment</h1>
                    <p>Create and assign tasks to experts</p>
                </div>
                <div className="header-actions">
                    <button 
                        className="btn btn-secondary" 
                        onClick={handleRefresh}
                        disabled={loading}
                        title="Refresh"
                    >
                        <RefreshCw size={16} className={loading ? 'spin' : ''} />
                    </button>
                    {canCreateTask && (
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            <Plus size={18} /> Create Task
                        </button>
                    )}
                </div>
            </div>

            {/* Expert count indicator */}
            {canCreateTask && (
                <div className="experts-info">
                    <User size={14} />
                    <span>
                        {loadingExperts ? 'Loading experts...' : `${assignableUsers.length} expert(s) available for assignment`}
                    </span>
                    {assignableUsers.length === 0 && !loadingExperts && (
                        <span className="warning-text">
                            <AlertCircle size={14} />
                            No experts found. Ensure users with EXPERT role exist.
                        </span>
                    )}
                </div>
            )}

            {loading ? (
                <div className="loading-state">
                    <Loader className="spin" size={32} />
                    <p>Loading tasks...</p>
                </div>
            ) : tasks.length === 0 ? (
                <div className="empty-state">
                    <Briefcase size={48} />
                    <h3>No Tasks</h3>
                    <p>{canCreateTask ? 'Create tasks to assign to experts' : 'No tasks have been assigned to you yet'}</p>
                </div>
            ) : (
                <div className="tasks-table-container">
                    <div className="tasks-summary">
                        <span className="summary-item">
                            <strong>{tasks.length}</strong> task{tasks.length !== 1 ? 's' : ''} total
                        </span>
                        <span className="summary-item pending">
                            <Clock size={12} />
                            <strong>{tasks.filter(t => t.status === 'Pending').length}</strong> pending
                        </span>
                        <span className="summary-item progress">
                            <Loader size={12} />
                            <strong>{tasks.filter(t => t.status === 'InProgress').length}</strong> in progress
                        </span>
                        <span className="summary-item completed">
                            <CheckCircle size={12} />
                            <strong>{tasks.filter(t => t.status === 'Completed').length}</strong> completed
                        </span>
                    </div>
                    <table className="tasks-table">
                        <thead>
                            <tr>
                                <th>Task</th>
                                <th>Assigned To</th>
                                <th>Due Date</th>
                                <th>Status</th>
                                <th>Created</th>
                                {canCreateTask && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.map(task => (
                                <tr key={task.id} className={updatingTask === task.id ? 'updating' : ''}>
                                    <td>
                                        <div className="task-title">{task.title}</div>
                                        <div className="task-description">{task.description}</div>
                                    </td>
                                    <td>
                                        <div className={`assigned-user ${task.assigned_user_name ? 'has-assignment' : ''}`}>
                                            <User size={14} />
                                            <span className="user-name">{task.assigned_user_name || 'Unassigned'}</span>
                                        </div>
                                        {task.assigned_user_email && (
                                            <div className="assigned-email">
                                                <Mail size={10} />
                                                {task.assigned_user_email}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <div className={`due-date ${task.due_date ? 'has-date' : ''}`}>
                                            <Calendar size={14} />
                                            {formatDate(task.due_date)}
                                        </div>
                                    </td>
                                    <td>{getStatusBadge(task.status)}</td>
                                    <td>
                                        <div className="created-info">
                                            <span className="created-by">
                                                {task.created_by_name || 'System'}
                                            </span>
                                            <span className="created-at">
                                                <Clock size={10} />
                                                {formatDate(task.created_at)}
                                            </span>
                                        </div>
                                    </td>
                                    {canCreateTask && (
                                        <td className="actions-cell">
                                            <div className="actions-row">
                                                <ExpertSelector
                                                    experts={assignableUsers}
                                                    selectedId={task.assigned_to || ''}
                                                    onSelect={(id) => handleAssignTask(task.id, id)}
                                                    placeholder="Assign"
                                                    loading={loadingExperts}
                                                    disabled={updatingTask === task.id}
                                                />
                                                <select
                                                    className="status-select"
                                                    value={task.status}
                                                    onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                                                    disabled={updatingTask === task.id}
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="InProgress">In Progress</option>
                                                    <option value="Completed">Completed</option>
                                                </select>
                                            </div>
                                            <div className="actions-row actions-buttons">
                                                <button
                                                    className="btn btn-icon btn-edit"
                                                    onClick={() => openEditModal(task)}
                                                    disabled={updatingTask === task.id}
                                                    title="Edit Task"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    className="btn btn-icon btn-delete"
                                                    onClick={() => openDeleteModal(task)}
                                                    disabled={updatingTask === task.id}
                                                    title="Delete Task"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Task Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2><Plus size={20} /> Create New Task</h2>
                            <button className="close-btn" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateTask}>
                            <div className="form-group">
                                <label>Task Title *</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter task title"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label>Description *</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Enter task description"
                                    rows={4}
                                    required
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Assign To Expert</label>
                                    <ExpertSelector
                                        experts={assignableUsers}
                                        selectedId={assignedTo}
                                        onSelect={setAssignedTo}
                                        placeholder="Select an expert..."
                                        loading={loadingExperts}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Due Date</label>
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? (
                                        <>
                                            <Loader size={16} className="spin" /> Creating...
                                        </>
                                    ) : (
                                        'Create Task'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Task Modal */}
            {showEditModal && editingTask && (
                <div className="modal-overlay" onClick={closeEditModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2><Edit2 size={20} /> Edit Task</h2>
                            <button className="close-btn" onClick={closeEditModal}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleEditTask}>
                            <div className="form-group">
                                <label>Task Title *</label>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    placeholder="Enter task title"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    placeholder="Enter task description"
                                    rows={4}
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Assign To Expert</label>
                                    <ExpertSelector
                                        experts={assignableUsers}
                                        selectedId={editAssignedTo}
                                        onSelect={setEditAssignedTo}
                                        placeholder="Select an expert..."
                                        loading={loadingExperts}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Due Date</label>
                                    <input
                                        type="date"
                                        value={editDueDate}
                                        onChange={(e) => setEditDueDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select
                                    value={editStatus}
                                    onChange={(e) => setEditStatus(e.target.value as Task['status'])}
                                    className="form-select"
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="InProgress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={closeEditModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? (
                                        <>
                                            <Loader size={16} className="spin" /> Saving...
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal - Using standardized ConfirmModal component */}
            <ConfirmModal
                isOpen={showDeleteModal}
                title="Delete Task"
                message={deletingTask 
                    ? `Are you sure you want to delete "${deletingTask.title}"?${deletingTask.assigned_user_name ? ` This task is currently assigned to ${deletingTask.assigned_user_name}.` : ''} This action cannot be undone.`
                    : 'Are you sure you want to delete this task? This action cannot be undone.'
                }
                confirmText="Delete Task"
                cancelText="Cancel"
                variant="danger"
                onConfirm={handleDeleteTask}
                onCancel={closeDeleteModal}
                isLoading={deleting}
            />
        </div>
    );
};

export default TaskAssignment;
