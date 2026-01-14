import React, { useState, useEffect } from 'react';
import { Send, Clock, Calendar, CheckCircle, XCircle, AlertCircle, Video } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getAccessToken } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../context/SessionContext';
import './MyConnectRequests.css';

interface ConnectRequest {
    id: string;
    expert_id: string;
    expert_name: string;
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
    expert_name: string;
    customer_name: string;
    scheduled_date: string;
    scheduled_slot_label: string;
    status: string;
    room_id: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://backend.proveloce.com';

const MyConnectRequests: React.FC = () => {
    const { user } = useAuth();
    const { success, error } = useToast();
    const navigate = useNavigate();
    const { setActiveSession } = useSession();
    const token = getAccessToken();

    const [requests, setRequests] = useState<ConnectRequest[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);

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
            // Fetch requests
            const reqResponse = await fetch(`${API_BASE}/api/connect-requests`, {
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

    const handleJoinSession = (sessionId: string) => {
        setActiveSession(sessionId);
        navigate('/session');
    };

    const getSessionForRequest = (requestId: string) => {
        return sessions.find(s => s.request_id === requestId && (s.status === 'scheduled' || s.status === 'live'));
    };

    return (
        <div className="my-requests-page">
            <div className="page-header">
                <div>
                    <h1><Send size={28} /> My Connect Requests</h1>
                    <p>Track your connect requests and join scheduled sessions</p>
                </div>
            </div>

            {loading ? (
                <div className="loading-state">Loading requests...</div>
            ) : requests.length === 0 ? (
                <div className="empty-state">
                    <Send size={48} />
                    <h3>No Connect Requests</h3>
                    <p>Find an expert and send a connect request to get started</p>
                    <button className="btn btn-primary" onClick={() => navigate('/customer/find-experts')}>
                        Find Experts
                    </button>
                </div>
            ) : (
                <div className="requests-list">
                    {requests.map(req => {
                        const session = getSessionForRequest(req.id);
                        return (
                            <div key={req.id} className="request-card">
                                <div className="request-main">
                                    <div className="request-info">
                                        <h4>{req.expert_name}</h4>
                                        <div className="request-meta">
                                            <span><Calendar size={14} /> {req.requested_date}</span>
                                            <span><Clock size={14} /> {slotLabels[req.requested_slot_label] || req.requested_slot_label}</span>
                                            <span className="day-type">{req.requested_day_type}</span>
                                        </div>
                                        {req.customer_note && (
                                            <p className="request-note">{req.customer_note}</p>
                                        )}
                                    </div>
                                    <div className="request-actions">
                                        {getStatusBadge(req.status)}
                                        {session && (
                                            <button
                                                className="btn btn-primary join-btn"
                                                onClick={() => handleJoinSession(session.id)}
                                            >
                                                <Video size={16} /> Join Session
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="request-footer">
                                    <span>Requested: {new Date(req.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MyConnectRequests;
