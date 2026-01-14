import React, { useState, useEffect, useRef } from 'react';
import Avatar from '../../components/common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getAccessToken } from '../../services/api';
import './Messages.css';

interface Conversation {
    other_user_id: string;
    other_user_name: string;
    other_user_avatar: string | null;
    last_message: string;
    last_message_at: string;
    unread_count: number;
}

interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    sender_name: string;
    content: string;
    created_at: string;
    read_at: string | null;
}

interface UserResult {
    id: string;
    name: string;
    email: string;
    role: string;
    profile_photo_url: string | null;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://backend.proveloce.com';

const Messages: React.FC = () => {
    const { user } = useAuth();
    const { error } = useToast();
    const token = getAccessToken();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; avatar: string | null } | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UserResult[]>([]);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        fetchConversations();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchConversations = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/messages/conversations`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setConversations(data.data?.conversations || []);
            }
        } catch (err) {
            console.error('Failed to fetch conversations:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (userId: string) => {
        try {
            const response = await fetch(`${API_BASE}/api/messages/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setMessages(data.data?.messages || []);
                if (data.data?.otherUser) {
                    setSelectedUser({
                        id: userId,
                        name: data.data.otherUser.name,
                        avatar: data.data.otherUser.profile_photo_url
                    });
                }
            }
        } catch (err) {
            error('Failed to load messages');
        }
    };

    const handleSelectConversation = (conv: Conversation) => {
        setSelectedUser({
            id: conv.other_user_id,
            name: conv.other_user_name,
            avatar: conv.other_user_avatar
        });
        fetchMessages(conv.other_user_id);
        setShowSearch(false);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser || sending) return;

        setSending(true);
        try {
            const response = await fetch(`${API_BASE}/api/messages/${selectedUser.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ content: newMessage.trim() })
            });
            const data = await response.json();
            if (data.success) {
                setNewMessage('');
                fetchMessages(selectedUser.id);
                fetchConversations();
            } else {
                error('Failed to send message');
            }
        } catch (err) {
            error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setSearching(true);
        try {
            const response = await fetch(`${API_BASE}/api/messages/users/search?q=${encodeURIComponent(searchQuery)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setSearchResults(data.data?.users || []);
            }
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setSearching(false);
        }
    };

    const handleStartConversation = (u: UserResult) => {
        setSelectedUser({ id: u.id, name: u.name, avatar: u.profile_photo_url });
        fetchMessages(u.id);
        setShowSearch(false);
        setSearchQuery('');
        setSearchResults([]);
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (days === 1) return 'Yesterday';
        if (days < 7) return date.toLocaleDateString([], { weekday: 'short' });
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    return (
        <div className="messages-page">
            <div className="messages-sidebar">
                <div className="messages-sidebar-header">
                    <h2><MessageSquare size={20} /> Messages</h2>
                    <button className="new-message-btn" onClick={() => setShowSearch(true)}>
                        <Plus size={18} />
                    </button>
                </div>

                {showSearch && (
                    <div className="user-search-panel">
                        <div className="search-header">
                            <button onClick={() => setShowSearch(false)}><ArrowLeft size={18} /></button>
                            <span>New Message</span>
                        </div>
                        <div className="search-input-wrapper">
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <button onClick={handleSearch} disabled={searching}>
                                <Search size={16} />
                            </button>
                        </div>
                        <div className="search-results">
                            {searchResults.map(u => (
                                <div key={u.id} className="search-result-item" onClick={() => handleStartConversation(u)}>
                                    <div className="user-avatar">
                                        <Avatar src={u.profile_photo_url} name={u.name} />
                                    </div>
                                    <div className="user-info">
                                        <span className="user-name">{u.name}</span>
                                        <span className="user-role">{u.role}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="conversations-list">
                    {loading ? (
                        <div className="loading-state">Loading...</div>
                    ) : conversations.length === 0 ? (
                        <div className="empty-state">
                            <MessageSquare size={32} />
                            <p>No conversations yet</p>
                            <small>Click + to start a new message</small>
                        </div>
                    ) : (
                        conversations.map(conv => (
                            <div
                                key={conv.other_user_id}
                                className={`conversation-item ${selectedUser?.id === conv.other_user_id ? 'active' : ''}`}
                                onClick={() => handleSelectConversation(conv)}
                            >
                                <div className="conv-avatar">
                                    <Avatar src={conv.other_user_avatar} name={conv.other_user_name} />
                                </div>
                                <div className="conv-details">
                                    <div className="conv-header">
                                        <span className="conv-name">{conv.other_user_name}</span>
                                        <span className="conv-time">{formatTime(conv.last_message_at)}</span>
                                    </div>
                                    <p className="conv-preview">{conv.last_message}</p>
                                </div>
                                {conv.unread_count > 0 && (
                                    <span className="unread-badge">{conv.unread_count}</span>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="messages-main">
                {selectedUser ? (
                    <>
                        <div className="messages-header">
                            <div className="selected-user-info">
                                <div className="user-avatar">
                                    <Avatar src={selectedUser.avatar} name={selectedUser.name} />
                                </div>
                                <span>{selectedUser.name}</span>
                            </div>
                        </div>

                        <div className="messages-thread">
                            {messages.map(msg => (
                                <div
                                    key={msg.id}
                                    className={`message-bubble ${msg.sender_id === user?.id ? 'sent' : 'received'}`}
                                >
                                    <p>{msg.content}</p>
                                    <span className="message-time">{formatTime(msg.created_at)}</span>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        <form className="message-input-form" onSubmit={handleSendMessage}>
                            <input
                                type="text"
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                disabled={sending}
                            />
                            <button type="submit" disabled={!newMessage.trim() || sending}>
                                <Send size={18} />
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="no-conversation-selected">
                        <MessageSquare size={48} />
                        <h3>Select a conversation</h3>
                        <p>Choose from your existing conversations or start a new one</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messages;
