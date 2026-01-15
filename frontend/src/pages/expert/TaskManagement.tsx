import React, { useState, useEffect, useCallback } from 'react';
import { 
    Briefcase, Calendar, Clock, CheckCircle, Loader, RefreshCw, 
    User, AlertCircle, Play, Pause
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getAccessToken } from '../../services/api';
import './TaskManagement.css';

interface Task {
    id: string;
    title: string;
    description: string;
    assigned_to: string | null;
    assigned_user_name: string | null;
    due_date: string | null;
    status: 'Pending' | 'InProgress' | 'Completed';
    created_by: string;
    created_by_name?: string | null;
    created_at: string;
    updated_at: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://backend.proveloce.com';

const TaskManagement: React.FC = () => {
    const { user } = useAuth();
    const { success, error } = useToast();
    const token = getAccessToken();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingTask, setUpdatingTask] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'Pending' | 'InProgress' | 'Completed'>('all');

    // Fetch tasks assigned to this expert
    const fetchTasks = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/tasks`, {
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                }
            });
            
            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Non-JSON response:', text.substring(0, 200));
                if (response.status === 401 || response.status === 403) {
                    error('Authentication failed. Please log in again.');
                } else {
                    error('Server returned an invalid response.');
                }
                return;
            }
            
            const data = await response.json();
            if (data.success) {
                const taskList = data.data?.tasks || [];
                // Ensure tasks are filtered for this expert (extra safety)
                setTasks(taskList);
                console.log(`Loaded ${taskList.length} tasks for expert`);
            } else {
                error(data.error || 'Failed to fetch tasks');
            }
        } catch (err: any) {
            console.error('Failed to fetch tasks:', err);
            if (err.message?.includes('JSON')) {
                error('Server returned an invalid response.');
            } else {
                error('Failed to fetch tasks');
            }
        } finally {
            setLoading(false);
        }
    }, [token, error]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    // Update task status
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

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Non-JSON response:', text.substring(0, 200));
                if (response.status === 401 || response.status === 403) {
                    error('Authentication failed. Please log in again.');
                } else if (response.ok) {
                    success(`Task marked as ${newStatus === 'InProgress' ? 'In Progress' : newStatus}`);
                    setTasks(prev => prev.map(t => 
                        t.id === taskId ? { ...t, status: newStatus as Task['status'] } : t
                    ));
                } else {
                    error('Server returned an invalid response.');
                }
                return;
            }

            const data = await response.json();
            if (data.success) {
                success(`Task marked as ${newStatus === 'InProgress' ? 'In Progress' : newStatus}`);
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
                error(data.error || 'Failed to update task');
            }
        } catch (err: any) {
            console.error('Status update error:', err);
            if (err.message?.includes('JSON')) {
                error('Server returned an invalid response.');
            } else {
                error('Failed to update task: ' + (err?.message || 'Unknown error'));
            }
        } finally {
            setUpdatingTask(null);
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

    const isOverdue = (dateStr: string | null, status: string) => {
        if (!dateStr || status === 'Completed') return false;
        try {
            return new Date(dateStr) < new Date();
        } catch {
            return false;
        }
    };

    const filteredTasks = filter === 'all' 
        ? tasks 
        : tasks.filter(t => t.status === filter);

    const taskCounts = {
        all: tasks.length,
        Pending: tasks.filter(t => t.status === 'Pending').length,
        InProgress: tasks.filter(t => t.status === 'InProgress').length,
        Completed: tasks.filter(t => t.status === 'Completed').length
    };

    return (
        <div className="expert-tasks-page">
            <div className="page-header">
                <div>
                    <h1><Briefcase size={28} /> My Tasks</h1>
                    <p>Manage your assigned tasks</p>
                </div>
                <button 
                    className="btn btn-secondary" 
                    onClick={fetchTasks}
                    disabled={loading}
                    title="Refresh"
                >
                    <RefreshCw size={16} className={loading ? 'spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="filter-tabs">
                <button 
                    className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All Tasks <span className="count">{taskCounts.all}</span>
                </button>
                <button 
                    className={`filter-tab ${filter === 'Pending' ? 'active' : ''}`}
                    onClick={() => setFilter('Pending')}
                >
                    <Clock size={14} /> Pending <span className="count">{taskCounts.Pending}</span>
                </button>
                <button 
                    className={`filter-tab ${filter === 'InProgress' ? 'active' : ''}`}
                    onClick={() => setFilter('InProgress')}
                >
                    <Loader size={14} /> In Progress <span className="count">{taskCounts.InProgress}</span>
                </button>
                <button 
                    className={`filter-tab ${filter === 'Completed' ? 'active' : ''}`}
                    onClick={() => setFilter('Completed')}
                >
                    <CheckCircle size={14} /> Completed <span className="count">{taskCounts.Completed}</span>
                </button>
            </div>

            {loading ? (
                <div className="loading-state">
                    <Loader className="spin" size={32} />
                    <p>Loading tasks...</p>
                </div>
            ) : tasks.length === 0 ? (
                <div className="empty-state">
                    <Briefcase size={48} />
                    <h3>No Tasks Assigned</h3>
                    <p>Tasks assigned to you will appear here</p>
                </div>
            ) : filteredTasks.length === 0 ? (
                <div className="empty-state">
                    <Briefcase size={48} />
                    <h3>No {filter === 'all' ? '' : filter} Tasks</h3>
                    <p>No tasks match the current filter</p>
                </div>
            ) : (
                <div className="tasks-grid">
                    {filteredTasks.map(task => (
                        <div 
                            key={task.id} 
                            className={`task-card ${task.status.toLowerCase()} ${updatingTask === task.id ? 'updating' : ''} ${isOverdue(task.due_date, task.status) ? 'overdue' : ''}`}
                        >
                            <div className="task-card-header">
                                {getStatusBadge(task.status)}
                                {isOverdue(task.due_date, task.status) && (
                                    <span className="overdue-badge">
                                        <AlertCircle size={12} /> Overdue
                                    </span>
                                )}
                            </div>
                            
                            <h3 className="task-title">{task.title}</h3>
                            <p className="task-description">{task.description || 'No description'}</p>
                            
                            <div className="task-meta">
                                <div className="meta-item">
                                    <Calendar size={14} />
                                    <span className={isOverdue(task.due_date, task.status) ? 'overdue-text' : ''}>
                                        {formatDate(task.due_date)}
                                    </span>
                                </div>
                                {task.created_by_name && (
                                    <div className="meta-item">
                                        <User size={14} />
                                        <span>From: {task.created_by_name}</span>
                                    </div>
                                )}
                                <div className="meta-item">
                                    <Clock size={14} />
                                    <span>Assigned: {formatDate(task.created_at)}</span>
                                </div>
                            </div>

                            <div className="task-actions">
                                {task.status === 'Pending' && (
                                    <button 
                                        className="btn btn-primary btn-sm"
                                        onClick={() => handleUpdateStatus(task.id, 'InProgress')}
                                        disabled={updatingTask === task.id}
                                    >
                                        {updatingTask === task.id ? (
                                            <Loader size={14} className="spin" />
                                        ) : (
                                            <Play size={14} />
                                        )}
                                        Start Task
                                    </button>
                                )}
                                {task.status === 'InProgress' && (
                                    <>
                                        <button 
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => handleUpdateStatus(task.id, 'Pending')}
                                            disabled={updatingTask === task.id}
                                        >
                                            <Pause size={14} />
                                            Pause
                                        </button>
                                        <button 
                                            className="btn btn-success btn-sm"
                                            onClick={() => handleUpdateStatus(task.id, 'Completed')}
                                            disabled={updatingTask === task.id}
                                        >
                                            {updatingTask === task.id ? (
                                                <Loader size={14} className="spin" />
                                            ) : (
                                                <CheckCircle size={14} />
                                            )}
                                            Complete
                                        </button>
                                    </>
                                )}
                                {task.status === 'Completed' && (
                                    <button 
                                        className="btn btn-outline btn-sm"
                                        onClick={() => handleUpdateStatus(task.id, 'InProgress')}
                                        disabled={updatingTask === task.id}
                                    >
                                        <RefreshCw size={14} />
                                        Reopen
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TaskManagement;
