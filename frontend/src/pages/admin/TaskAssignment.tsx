import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, X, Calendar, User, Clock, CheckCircle, Loader } from 'lucide-react';
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
    role: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://backend.proveloce.com';

const TaskAssignment: React.FC = () => {
    const { user } = useAuth();
    const { success, error } = useToast();
    const token = getAccessToken();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [assignableUsers, setAssignableUsers] = useState<UserData[]>([]);

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
        try {
            const response = await fetch(`${API_BASE}/api/users?roles=EXPERT`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setAssignableUsers(data.data?.users || []);
            }
        } catch (err) {
            console.error('Failed to fetch users:', err);
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
                {canCreateTask && (
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={18} /> Create Task
                    </button>
                )}
            </div>

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
                                        <td>
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
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Assign To</label>
                                    <select
                                        value={assignedTo}
                                        onChange={(e) => setAssignedTo(e.target.value)}
                                    >
                                        <option value="">-- Select Expert --</option>
                                        {assignableUsers.map(u => (
                                            <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Due Date</label>
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                    />
                                </div>
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
