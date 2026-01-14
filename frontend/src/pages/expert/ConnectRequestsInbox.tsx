import React, { useState, useEffect } from 'react';
import { Inbox, Clock, Calendar, CheckCircle, XCircle, AlertCircle, Video, Check, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getAccessToken } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../context/SessionContext';
import './ConnectRequestsInbox.css';

interface ConnectRequest {
    id: string;
    customer_id: string;
    customer_name: string;
    requested_date: string;
    requested_day_type: string;
    requested_slot_label: string;
    status: 'pending' | 'accepted' | 'rejected';
    customer_note: string | null;
    created_at: string;
}

interface Session {
    id: string;
    request_id: string;
    status: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://backend.proveloce.com';

const ConnectRequestsInbox: React.FC = () => {
    const { user } = useAuth();
    const { success, error } = useToast();
    const navigate = useNavigate();
    const { setActiveSession } = useSession();
    const token = getAccessToken();

    const [requests, setRequests] = useState<ConnectRequest[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    const slotLabels: Record<string, string> = {
        '00-06': '12AM – 6AM',
        '06-12': '6AM – 12PM',
        '12-18': '12PM – 6PM',
        '18-24': '6PM – 12AM'
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch requests (expert view)
            const reqResponse = await fetch(`${API_BASE}/api/connect-requests?view=expert`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const reqData = await reqResponse.json();
            if (reqData.success) {
                setRequests(reqData.data?.requests || []);
            }

            // Fetch sessions
            const sessResponse = await fetch(`${API_BASE}/api/sessions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const sessData = await sessResponse.json();
            if (sessData.success) {
                setSessions(sessData.data?.sessions || []);
            }
        } catch (err) {
            console.error('Failed to fetch data:', err);
            error('Failed to load requests');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (requestId: string, newStatus: 'accepted' | 'rejected') => {
        setUpdating(requestId);
        try {
            const response = await fetch(`${API_BASE}/api/connect-requests/${requestId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            const data = await response.json();
            if (data.success) {
                success(`Request ${newStatus}`);
                fetchData();
            } else {
                error(data.error || 'Failed to update request');
            }
        } catch (err) {
            error('Failed to update request');
        } finally {
            setUpdating(null);
        }
    };

    const handleStartSession = async (requestId: string) => {
        const session = sessions.find(s => s.request_id === requestId);
        if (session) {
            try {
                await fetch(`${API_BASE}/api/sessions/${session.id}/start`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` }
                });
                setActiveSession(session.id);
                navigate('/session');
            } catch (err) {
                error('Failed to start session');
            }
        }
    };

    const getStatusBadge = (status: string) => {
        const config: Record<string, { icon: React.ReactNode; className: string }> = {
            pending: { icon: <AlertCircle size={14} />, className: 'status-pending' },
            accepted: { icon: <CheckCircle size={14} />, className: 'status-accepted' },
            rejected: { icon: <XCircle size={14} />, className: 'status-rejected' }
        };
        const c = config[status] || config.pending;
        return (
            <span className={`status-badge ${c.className}`}>
                {c.icon} {status}
            </span>
        );
    };

    const getSessionForRequest = (requestId: string) => {
        return sessions.find(s => s.request_id === requestId && (s.status === 'scheduled' || s.status === 'live'));
    };

    return (
        <div className="inbox-page">
            <div className="page-header">
                <div>
                    <h1><Inbox size={28} /> Connect Requests</h1>
                    <p>Review and manage connect requests from customers</p>
                </div>
            </div>

            {loading ? (
                <div className="loading-state">Loading requests...</div>
            ) : requests.length === 0 ? (
                <div className="empty-state">
                    <Inbox size={48} />
                    <h3>No Connect Requests</h3>
                    <p>You haven't received any connect requests yet</p>
                </div>
            ) : (
                <div className="requests-list">
                    {requests.map(req => {
                        const session = getSessionForRequest(req.id);
                        const isUpdating = updating === req.id;
                        return (
                            <div key={req.id} className="request-card">
                                <div className="request-main">
                                    <div className="request-info">
                                        <h4>{req.customer_name}</h4>
                                        <div className="request-meta">
                                            <span><Calendar size={14} /> {req.requested_date}</span>
                                            <span><Clock size={14} /> {slotLabels[req.requested_slot_label] || req.requested_slot_label}</span>
                                            <span className="day-type">{req.requested_day_type}</span>
                                        </div>
                                        {req.customer_note && (
                                            <p className="request-note">"{req.customer_note}"</p>
                                        )}
                                    </div>
                                    <div className="request-actions">
                                        {req.status === 'pending' ? (
                                            <div className="action-buttons">
                                                <button
                                                    className="btn btn-success"
                                                    onClick={() => handleUpdateStatus(req.id, 'accepted')}
                                                    disabled={isUpdating}
                                                >
                                                    <Check size={16} /> Accept
                                                </button>
                                                <button
                                                    className="btn btn-danger"
                                                    onClick={() => handleUpdateStatus(req.id, 'rejected')}
                                                    disabled={isUpdating}
                                                >
                                                    <X size={16} /> Reject
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                {getStatusBadge(req.status)}
                                                {session && (
                                                    <button
                                                        className="btn btn-primary"
                                                        onClick={() => handleStartSession(req.id)}
                                                    >
                                                        <Video size={16} /> Start Session
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="request-footer">
                                    <span>Received: {new Date(req.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ConnectRequestsInbox;
