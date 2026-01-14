import React, { useState, useEffect, useRef } from 'react';
import { Video, MessageSquare, Clock, Send, Paperclip, PhoneOff, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getAccessToken } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../context/SessionContext';
import './SessionRoom.css';

interface Message {
    id: string;
    sender_id: string;
    sender_name: string;
    content_text: string | null;
    attachment_url: string | null;
    created_at: string;
}

interface SessionData {
    id: string;
    expert_id: string;
    customer_id: string;
    expert_name: string;
    customer_name: string;
    status: string;
    started_at: string | null;
    room_id: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://backend.proveloce.com';

const SessionRoom: React.FC = () => {
    const { user } = useAuth();
    const { success, error } = useToast();
    const { activeSessionId: sessionId } = useSession();
    const navigate = useNavigate();
    const token = getAccessToken();
    const chatRef = useRef<HTMLDivElement>(null);

    const [session, setSession] = useState<SessionData | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [messageText, setMessageText] = useState('');
    const [sending, setSending] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);

    useEffect(() => {
        fetchSession();
        // WhatsApp-like live updates: Poll every 1 second when in active session
        const interval = setInterval(fetchMessages, 1000);
        return () => clearInterval(interval);
    }, [sessionId]);

    useEffect(() => {
        if (session?.started_at) {
            const startTime = new Date(session.started_at).getTime();
            const timer = setInterval(() => {
                setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [session?.started_at]);

    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchSession = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/sessions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                const s = (data.data?.sessions || []).find((s: any) => s.id === sessionId);
                setSession(s || null);
            }
        } catch (err) {
            console.error('Failed to fetch session:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/sessions/${sessionId}/messages`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setMessages(data.data?.messages || []);
            }
        } catch (err) {
            console.error('Failed to fetch messages:', err);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageText.trim()) return;

        setSending(true);
        try {
            const response = await fetch(`${API_BASE}/api/sessions/${sessionId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ content: messageText.trim() })
            });

            const data = await response.json();
            if (data.success) {
                setMessageText('');
                fetchMessages();
            } else {
                error('Failed to send message');
            }
        } catch (err) {
            error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleEndSession = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/sessions/${sessionId}/end`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await response.json();
            if (data.success) {
                success('Session ended');
                navigate(-1);
            } else {
                error('Failed to end session');
            }
        } catch (err) {
            error('Failed to end session');
        }
    };

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="session-room">
                <div className="loading-state">Loading session...</div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="session-room">
                <div className="empty-state">Session not found</div>
            </div>
        );
    }

    const otherPartyName = user?.id === session.expert_id ? session.customer_name : session.expert_name;

    return (
        <div className="session-room">
            {/* Header */}
            <div className="session-header">
                <div className="session-info">
                    <h2><Video size={24} /> Session with {otherPartyName}</h2>
                    <div className="session-timer">
                        <Clock size={16} />
                        <span>{formatTime(elapsedTime)}</span>
                    </div>
                </div>
                <button className="btn btn-danger end-btn" onClick={handleEndSession}>
                    <PhoneOff size={18} /> End Session
                </button>
            </div>

            <div className="session-content">
                {/* Video Area */}
                <div className="video-area">
                    <div className="video-placeholder">
                        <Video size={64} />
                        <p>Video Call</p>
                        <span className="video-note">
                            Video calling is powered by Jitsi Meet.
                            <br />
                            <a
                                href={`https://meet.jit.si/${session.room_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-primary"
                            >
                                Open Video Call
                            </a>
                        </span>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="chat-area">
                    <div className="chat-header">
                        <MessageSquare size={18} />
                        <span>Chat</span>
                    </div>

                    <div className="chat-messages" ref={chatRef}>
                        {messages.length === 0 ? (
                            <div className="no-messages">No messages yet</div>
                        ) : (
                            messages.map(msg => (
                                <div
                                    key={msg.id}
                                    className={`message ${msg.sender_id === user?.id ? 'own' : 'other'}`}
                                >
                                    <div className="message-sender">{msg.sender_name}</div>
                                    <div className="message-content">
                                        {msg.content_text}
                                        {msg.attachment_url && (
                                            <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer">
                                                📎 Attachment
                                            </a>
                                        )}
                                    </div>
                                    <div className="message-time">
                                        {new Date(msg.created_at).toLocaleTimeString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <form className="chat-input" onSubmit={handleSendMessage}>
                        <input
                            type="text"
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            placeholder={session.status === 'live' ? "Type a message..." : "Messaging is only available when session is live"}
                            disabled={sending || session.status !== 'live'}
                        />
                        <button
                            type="submit"
                            className="send-btn"
                            disabled={sending || !messageText.trim() || session.status !== 'live'}
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SessionRoom;
