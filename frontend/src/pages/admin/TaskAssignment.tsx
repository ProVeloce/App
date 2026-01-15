import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    Briefcase, Plus, X, Calendar, User, Clock, CheckCircle, Loader, 
    Search, ChevronDown, RefreshCw, Mail, Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getAccessToken } from '../../services/api';
import './TaskAssignment.css';

interface Task {
    id: string;
    title: string;
    description: string;
    assigned_to: string | null;
    assigned_user_name: string | null;
    due_date: string | null;
    status: 'Pending' | 'InProgress' | 'Completed';
    created_at: string;
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
}

const ExpertSelector: React.FC<ExpertSelectorProps> = ({ 
    experts, 
    selectedId, 
    onSelect, 
    placeholder = "Select Expert",
    loading = false
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
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    const selectedExpert = experts.find(e => e.id === selectedId);

    const handleSelect = (id: string) => {
        onSelect(id);
        setIsOpen(false);
        setSearchQuery('');
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect('');
        setSearchQuery('');
    };

    return (
        <div className="expert-selector" ref={dropdownRef}>
            <button 
                type="button"
                className={`expert-selector-trigger ${isOpen ? 'open' : ''} ${selectedId ? 'has-value' : ''}`}
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) {
                        setTimeout(() => inputRef.current?.focus(), 100);
                    }
                }}
            >
                {loading ? (
                    <span className="selector-placeholder">
                        <Loader size={14} className="spin" /> Loading experts...
                    </span>
                ) : selectedExpert ? (
                    <span className="selected-expert">
                        <User size={14} />
                        <span className="expert-name">{selectedExpert.name}</span>
                        <span className="expert-role">{selectedExpert.role}</span>
                    </span>
                ) : (
                    <span className="selector-placeholder">
                        <User size={14} />
                        {placeholder}
                    </span>
                )}
                <div className="selector-actions">
                    {selectedId && (
                        <span className="clear-btn" onClick={handleClear} title="Clear selection">
                            <X size={14} />
                        </span>
                    )}
                    <ChevronDown size={16} className={`chevron ${isOpen ? 'rotated' : ''}`} />
                </div>
            </button>

            {isOpen && (
                <div className="expert-dropdown">
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

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [dueDate, setDueDate] = useState('');

    const userRole = user?.role?.toUpperCase() || '';
    const canCreateTask = userRole === 'ADMIN' || userRole === 'SUPERADMIN';

    useEffect(() => {
        fetchTasks();
        if (canCreateTask) {
            fetchAssignableUsers();
        }
    }, []);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/tasks`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setTasks(data.data?.tasks || []);
            }
        } catch (err) {
            console.error('Failed to fetch tasks:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAssignableUsers = async () => {
        setLoadingExperts(true);
        try {
            // Fetch experts - the API returns users with role EXPERT
            const response = await fetch(`${API_BASE}/api/users?roles=EXPERT`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            
            if (data.success) {
                // Handle different response structures
                let users: UserData[] = [];
                
                if (data.data?.data && Array.isArray(data.data.data)) {
                    // Structure: { success: true, data: { data: [...] } }
                    users = data.data.data;
                } else if (data.data?.users && Array.isArray(data.data.users)) {
                    // Structure: { success: true, data: { users: [...] } }
                    users = data.data.users;
                } else if (Array.isArray(data.data)) {
                    // Structure: { success: true, data: [...] }
                    users = data.data;
                }
                
                // Filter to only include active experts
                const activeExperts = users.filter(u => 
                    u.status !== 'inactive' && u.status !== 'suspended'
                );
                
                setAssignableUsers(activeExperts);
            }
        } catch (err) {
            console.error('Failed to fetch users:', err);
            error('Failed to load experts');
        } finally {
            setLoadingExperts(false);
        }
    };

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
                success('Task created successfully');
                setShowModal(false);
                resetForm();
                fetchTasks();
            } else {
                error(data.error || 'Failed to create task');
            }
        } catch (err) {
            error('Failed to create task');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateStatus = async (taskId: string, newStatus: string) => {
        try {
            const response = await fetch(`${API_BASE}/api/tasks/${taskId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            const data = await response.json();
            if (data.success) {
                success('Task status updated');
                fetchTasks();
            } else {
                error(data.error || 'Failed to update task');
            }
        } catch (err) {
            error('Failed to update task');
        }
    };

    const handleAssignTask = async (taskId: string, expertId: string) => {
        try {
            const response = await fetch(`${API_BASE}/api/tasks/${taskId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ assignedTo: expertId || null })
            });

            const data = await response.json();
            if (data.success) {
                const expertName = assignableUsers.find(u => u.id === expertId)?.name;
                success(expertId ? `Task assigned to ${expertName}` : 'Task unassigned');
                fetchTasks();
            } else {
                error(data.error || 'Failed to assign task');
            }
        } catch (err) {
            error('Failed to assign task');
        }
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setAssignedTo('');
        setDueDate('');
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
                {status}
            </span>
        );
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'No due date';
        return new Date(dateStr).toLocaleDateString();
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
                        onClick={() => { fetchTasks(); fetchAssignableUsers(); }}
                        title="Refresh"
                    >
                        <RefreshCw size={16} />
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
                    <table className="tasks-table">
                        <thead>
                            <tr>
                                <th>Task</th>
                                <th>Assigned To</th>
                                <th>Due Date</th>
                                <th>Status</th>
                                {canCreateTask && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.map(task => (
                                <tr key={task.id}>
                                    <td>
                                        <div className="task-title">{task.title}</div>
                                        <div className="task-description">{task.description}</div>
                                    </td>
                                    <td>
                                        <div className="assigned-user">
                                            <User size={14} />
                                            {task.assigned_user_name || 'Unassigned'}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="due-date">
                                            <Calendar size={14} />
                                            {formatDate(task.due_date)}
                                        </div>
                                    </td>
                                    <td>{getStatusBadge(task.status)}</td>
                                    {canCreateTask && (
                                        <td className="actions-cell">
                                            <ExpertSelector
                                                experts={assignableUsers}
                                                selectedId={task.assigned_to || ''}
                                                onSelect={(id) => handleAssignTask(task.id, id)}
                                                placeholder="Assign Expert"
                                                loading={loadingExperts}
                                            />
                                            <select
                                                className="status-select"
                                                value={task.status}
                                                onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="InProgress">In Progress</option>
                                                <option value="Completed">Completed</option>
                                            </select>
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
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Creating...' : 'Create Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskAssignment;
