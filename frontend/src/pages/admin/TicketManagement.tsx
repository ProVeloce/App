import React, { useState, useEffect } from 'react';
import { ticketApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
    MessageCircle, Clock, CheckCircle, X, AlertCircle,
    User, Mail, Phone, Eye, Send
} from 'lucide-react';
import './TicketManagement.css';

interface Ticket {
    id: number;
    ticket_id: string;
    user_id: string;
    user_role: string;
    user_full_name: string;
    user_email: string;
    user_phone_number: string | null;
    subject: string;
    category: string;
    description: string;
    attachment_url: string | null;
    status: string;
    admin_reply: string | null;
    created_at: string;
    updated_at: string;
}

const TicketManagement: React.FC = () => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [replyText, setReplyText] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
    const [submittingReply, setSubmittingReply] = useState(false);
    const { success, error } = useToast();
    const { user } = useAuth();

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const response = await ticketApi.getAllTickets();
            if (response.data.success && response.data.data) {
                setTickets(response.data.data.tickets || []);
            }
        } catch (err) {
            error('Failed to load tickets');
        } finally {
            setLoading(false);
        }
    };

    const handleViewTicket = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setReplyText('');
        setSelectedStatus('APPROVED');
    };

    const handleSendReply = async () => {
        if (!selectedTicket || !replyText.trim()) return;

        setSubmittingReply(true);
        try {
            await ticketApi.updateTicketStatus(selectedTicket.ticket_id, selectedStatus, replyText.trim());
            success('Reply sent successfully');
            setSelectedTicket(null);
            fetchTickets(); // Refresh the list
        } catch (err: any) {
            error(err.response?.data?.message || 'Failed to send reply');
        } finally {
            setSubmittingReply(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PENDING': return <AlertCircle size={16} className="status-pending" />;
            case 'APPROVED': return <CheckCircle size={16} className="status-approved" />;
            case 'REJECTED': return <X size={16} className="status-rejected" />;
            default: return <Clock size={16} className="status-default" />;
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'PENDING': return 'status-pending';
            case 'APPROVED': return 'status-approved';
            case 'REJECTED': return 'status-rejected';
            default: return 'status-default';
        }
    };

    if (loading) {
        return <div className="loading-state"><div className="loading-spinner" /></div>;
    }

    return (
        <div className="ticket-management">
            <div className="page-header">
                <h1>Ticket Management</h1>
                <p>Review and respond to support tickets</p>
            </div>

            <div className="tickets-container">
                {tickets.length === 0 ? (
                    <div className="empty-state">
                        <MessageCircle size={48} className="empty-icon" />
                        <h2>No tickets found</h2>
                        <p>All tickets have been processed</p>
                    </div>
                ) : (
                    <div className="tickets-list">
                        {tickets.map((ticket) => (
                            <div key={ticket.id} className="ticket-item" onClick={() => handleViewTicket(ticket)}>
                                <div className="ticket-status">
                                    {getStatusIcon(ticket.status)}
                                </div>
                                <div className="ticket-content">
                                    <div className="ticket-id">{ticket.ticket_id}</div>
                                    <h4>{ticket.subject}</h4>
                                    <div className="ticket-user">
                                        <User size={14} />
                                        <span>{ticket.user_full_name} ({ticket.user_role})</span>
                                    </div>
                                    <div className="ticket-meta">
                                        <span className="ticket-category">{ticket.category}</span>
                                        <span className={`ticket-status-badge ${getStatusBadgeClass(ticket.status)}`}>
                                            {ticket.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="ticket-actions">
                                    <button className="btn btn-primary btn-sm">
                                        <Eye size={14} /> View
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Ticket Detail Modal */}
            {selectedTicket && (
                <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
                    <div className="modal-content ticket-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <div className="ticket-id-large">{selectedTicket.ticket_id}</div>
                                <h2>{selectedTicket.subject}</h2>
                                <div className="ticket-meta">
                                    <span className={`ticket-status-badge ${getStatusBadgeClass(selectedTicket.status)}`}>
                                        {selectedTicket.status}
                                    </span>
                                    <span className="ticket-category">{selectedTicket.category}</span>
                                </div>
                            </div>
                            <button className="close-btn" onClick={() => setSelectedTicket(null)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body">
                            {/* User Identity Section */}
                            <div className="user-identity-section">
                                <h3>User Identity</h3>
                                <div className="user-details">
                                    <div className="user-detail">
                                        <User size={16} />
                                        <span><strong>Full Name:</strong> {selectedTicket.user_full_name}</span>
                                    </div>
                                    <div className="user-detail">
                                        <Mail size={16} />
                                        <span><strong>Email:</strong> {selectedTicket.user_email}</span>
                                    </div>
                                    <div className="user-detail">
                                        <Phone size={16} />
                                        <span><strong>Phone:</strong> {selectedTicket.user_phone_number || 'Not provided'}</span>
                                    </div>
                                    <div className="user-detail">
                                        <span><strong>Role:</strong> {selectedTicket.user_role}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Ticket Info Section */}
                            <div className="ticket-info-section">
                                <h3>Ticket Information</h3>
                                <div className="ticket-details">
                                    <div className="ticket-detail">
                                        <strong>Ticket ID:</strong> {selectedTicket.ticket_id}
                                    </div>
                                    <div className="ticket-detail">
                                        <strong>Category:</strong> {selectedTicket.category}
                                    </div>
                                    <div className="ticket-detail">
                                        <strong>Subject:</strong> {selectedTicket.subject}
                                    </div>
                                    <div className="ticket-detail">
                                        <strong>Description:</strong>
                                        <p>{selectedTicket.description}</p>
                                    </div>
                                    <div className="ticket-detail">
                                        <strong>Status:</strong>
                                        <span className={`status-badge ${getStatusBadgeClass(selectedTicket.status)}`}>
                                            {selectedTicket.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Attachment Section */}
                            <div className="attachment-section">
                                <h3>Attachment</h3>
                                {selectedTicket.attachment_url ? (
                                    <div className="attachment-actions">
                                        <a href={selectedTicket.attachment_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                                            View Attachment
                                        </a>
                                        <a href={selectedTicket.attachment_url} download className="btn btn-secondary">
                                            Download
                                        </a>
                                    </div>
                                ) : (
                                    <p className="no-attachment">No attachment provided</p>
                                )}
                            </div>

                            {/* Admin Reply Section */}
                            {selectedTicket.status === 'PENDING' && (
                                <div className="admin-reply-section">
                                    <h3>Send Response</h3>
                                    <div className="reply-form">
                                        <div className="status-selector">
                                            <label>Status:</label>
                                            <select
                                                value={selectedStatus}
                                                onChange={(e) => setSelectedStatus(e.target.value as 'APPROVED' | 'REJECTED')}
                                            >
                                                <option value="APPROVED">Approved</option>
                                                <option value="REJECTED">Rejected</option>
                                            </select>
                                        </div>
                                        <div className="reply-textarea">
                                            <label>Reply Message:</label>
                                            <textarea
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder="Enter your response to the user..."
                                                rows={4}
                                            />
                                        </div>
                                        <button
                                            className="btn btn-primary send-reply-btn"
                                            onClick={handleSendReply}
                                            disabled={!replyText.trim() || submittingReply}
                                        >
                                            {submittingReply ? (
                                                <>Sending...</>
                                            ) : (
                                                <>
                                                    <Send size={16} /> Send Response
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Previous Admin Reply */}
                            {selectedTicket.admin_reply && (
                                <div className="previous-reply-section">
                                    <h3>Previous Response</h3>
                                    <div className="admin-reply-content">
                                        <p>{selectedTicket.admin_reply}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TicketManagement;