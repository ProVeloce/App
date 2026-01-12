import React, { useState, useEffect } from 'react';
import { ticketApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { HelpCircle, Plus, MessageCircle, CheckCircle, AlertCircle, X, Send, Download, Eye, User, Mail, Phone, Shield, FileText } from 'lucide-react';
import NewTicketModal from '../../components/common/NewTicketModal';
import './HelpDesk.css';
import '../../styles/AdvancedModalAnimations.css';

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

const HelpDesk: React.FC = () => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewTicket, setShowNewTicket] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [isClosingViewTicket, setIsClosingViewTicket] = useState(false);

    // Admin response state
    const [adminReply, setAdminReply] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
    const [submittingResponse, setSubmittingResponse] = useState(false);

    // Attachment preview modal state
    const [attachmentPreview, setAttachmentPreview] = useState<{ show: boolean; url: string; filename: string }>({
        show: false, url: '', filename: ''
    });

    const { success, error } = useToast();
    const { user } = useAuth();

    const userRole = user?.role?.toUpperCase() || 'CUSTOMER';
    const isAdminOrSuperAdmin = userRole === 'ADMIN' || userRole === 'SUPERADMIN';
    const canCreateTicket = userRole !== 'SUPERADMIN';

    useEffect(() => { fetchTickets(); }, []);

    const fetchTickets = async () => {
        try {
            const response = await ticketApi.getMyTickets();
            if (response.data.success && response.data.data) setTickets(response.data.data.tickets || []);
        } catch (err) { error('Failed to load tickets'); } finally { setLoading(false); }
    };

    const closeViewTicket = () => {
        setIsClosingViewTicket(true);
        setTimeout(() => {
            setSelectedTicket(null);
            setIsClosingViewTicket(false);
            setAdminReply('');
            setSelectedStatus('APPROVED');
        }, 300);
    };

    const handleCreateTicket = async (data: { category: string; subject: string; description: string; attachment?: File | null }): Promise<{ ticketNumber: string }> => {
        const formData = new FormData();
        formData.append('category', data.category);
        formData.append('subject', data.subject);
        formData.append('description', data.description);
        if (data.attachment) {
            formData.append('attachment', data.attachment);
        }
        const response = await ticketApi.createTicket(formData);
        const ticketNumber = response.data?.data?.ticketId || 'UNKNOWN';
        success('Ticket submitted successfully');
        fetchTickets();
        return { ticketNumber };
    };

    const handleViewTicket = async (ticket: Ticket) => {
        try {
            const response = await ticketApi.getTicketById(ticket.ticket_id);
            if (response.data.success && response.data.data) {
                setSelectedTicket(response.data.data.ticket);
                setAdminReply(response.data.data.ticket.admin_reply || '');
            }
        } catch (err: any) {
            error(err.response?.data?.message || 'Failed to load ticket');
        }
    };

    const handleSendResponse = async () => {
        if (!selectedTicket || !adminReply.trim()) {
            error('Please enter a response message');
            return;
        }

        setSubmittingResponse(true);
        try {
            await ticketApi.updateTicketStatus(selectedTicket.ticket_id, selectedStatus, adminReply.trim());
            success(`Ticket ${selectedStatus.toLowerCase()} successfully`);
            fetchTickets();
            closeViewTicket();
        } catch (err: any) {
            error(err.response?.data?.message || 'Failed to update ticket');
        } finally {
            setSubmittingResponse(false);
        }
    };

    // Open attachment in inline modal (POML: redirect=false, mode=popup)
    const handleViewAttachment = (url: string) => {
        const filename = url.split('/').pop() || 'attachment';
        setAttachmentPreview({ show: true, url, filename });
    };

    // Direct download without redirect (POML: mode=direct, redirect=false)
    const handleDownloadAttachment = async (url: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const filename = url.split('/').pop() || 'attachment';
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (err) {
            error('Failed to download attachment');
        }
    };

    const closeAttachmentPreview = () => {
        setAttachmentPreview({ show: false, url: '', filename: '' });
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PENDING': return <AlertCircle size={16} className="status-pending" />;
            case 'APPROVED': return <CheckCircle size={16} className="status-approved" />;
            case 'REJECTED': return <X size={16} className="status-rejected" />;
            default: return <AlertCircle size={16} />;
        }
    };

    return (
        <div className="helpdesk-page">
            <div className="page-header">
                <div className="header-left">
                    <h1 className="helpdesk-title">
                        <HelpCircle size={24} className="title-icon" />
                        <span className="title-main">Help Desk</span>
                        <span className="title-separator">·</span>
                        <span className="title-sub">
                            {isAdminOrSuperAdmin ? 'Review and respond to tickets' : 'Get support from our team'}
                        </span>
                    </h1>
                </div>
                {canCreateTicket && (
                    <button className="btn btn-primary" onClick={() => setShowNewTicket(true)}>
                        <Plus size={18} /> New Ticket
                    </button>
                )}
            </div>

            <div className="tickets-container">
                {loading ? (
                    <div className="loading-state"><div className="loading-spinner" /></div>
                ) : tickets.length === 0 ? (
                    <div className="empty-state">
                        <MessageCircle size={48} className="empty-icon" />
                        <h2>No tickets yet</h2>
                        <p>{isAdminOrSuperAdmin ? 'No tickets require your attention' : 'Create a ticket to get support from our team'}</p>
                        {canCreateTicket && (
                            <button className="btn btn-primary empty-cta" onClick={() => setShowNewTicket(true)}>
                                Create Ticket
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="tickets-list">
                        {tickets.map((t) => (
                            <div key={t.id} className="ticket-item" onClick={() => handleViewTicket(t)}>
                                <div className="ticket-status">{getStatusIcon(t.status)}</div>
                                <div className="ticket-content">
                                    <div className="ticket-id-small">{t.ticket_id}</div>
                                    <h4>{t.subject}</h4>
                                    <div className="ticket-meta">
                                        <span className="ticket-category">{t.category}</span>
                                        <span className={`ticket-status-badge ${t.status.toLowerCase()}`}>{t.status}</span>
                                        {isAdminOrSuperAdmin && <span className="ticket-user-badge">{t.user_full_name || 'Unknown User'}</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <NewTicketModal
                isOpen={showNewTicket}
                onClose={() => setShowNewTicket(false)}
                onSubmit={handleCreateTicket}
            />

            {/* View Ticket Modal */}
            {selectedTicket && (
                <div className={`modal-overlay modal-overlay-advanced ${isClosingViewTicket ? 'closing' : ''}`} onClick={closeViewTicket}>
                    <div className={`modal modal-content-advanced ticket-detail-modal ${isClosingViewTicket ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <div className="ticket-id-tag">{selectedTicket.ticket_id}</div>
                                <h2 className="modal-title-advanced">{selectedTicket.subject}</h2>
                                <div className="ticket-meta" style={{ marginTop: '8px' }}>
                                    <span className={`ticket-status-badge ${selectedTicket.status.toLowerCase()}`}>{selectedTicket.status}</span>
                                    <span className="ticket-category">{selectedTicket.category}</span>
                                </div>
                            </div>
                            <button className="close-btn modal-close-button-advanced" onClick={closeViewTicket}><X size={20} /></button>
                        </div>

                        <div className="ticket-detail-body modal-text-advanced">
                            {/* User Identity Card - Admin/SuperAdmin Only */}
                            {isAdminOrSuperAdmin && (
                                <div className="user-identity-card">
                                    <label>Submitted By</label>
                                    <div className="identity-details">
                                        <div className="identity-row">
                                            <User size={16} />
                                            <span>{selectedTicket.user_full_name || 'Unknown'}</span>
                                        </div>
                                        <div className="identity-row">
                                            <Mail size={16} />
                                            <span>{selectedTicket.user_email || 'No email'}</span>
                                        </div>
                                        {selectedTicket.user_phone_number && (
                                            <div className="identity-row">
                                                <Phone size={16} />
                                                <span>{selectedTicket.user_phone_number}</span>
                                            </div>
                                        )}
                                        <div className="identity-row">
                                            <Shield size={16} />
                                            <span className="role-badge">{selectedTicket.user_role}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="ticket-description">
                                <label>Description</label>
                                <p>{selectedTicket.description}</p>
                            </div>

                            {/* Attachment Section */}
                            <div className="ticket-attachment">
                                <label>Attachment</label>
                                {selectedTicket.attachment_url ? (
                                    <div className="attachment-actions">
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => handleViewAttachment(selectedTicket.attachment_url!)}
                                        >
                                            <Eye size={14} /> View
                                        </button>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => handleDownloadAttachment(selectedTicket.attachment_url!)}
                                        >
                                            <Download size={14} /> Download
                                        </button>
                                    </div>
                                ) : (
                                    <p className="no-attachment">No attachment provided</p>
                                )}
                            </div>

                            {/* Admin Reply Section (for users viewing response) */}
                            {selectedTicket.admin_reply && (
                                <div className="ticket-admin-reply">
                                    <label>Admin Response</label>
                                    <div className="admin-reply-content">
                                        <p>{selectedTicket.admin_reply}</p>
                                    </div>
                                </div>
                            )}

                            {/* Pending Status Message (for users) */}
                            {!isAdminOrSuperAdmin && !selectedTicket.admin_reply && selectedTicket.status === 'PENDING' && (
                                <div className="ticket-pending-notice">
                                    <AlertCircle size={20} />
                                    <span>Waiting for response from our support team...</span>
                                </div>
                            )}

                            {/* Admin Response Form */}
                            {isAdminOrSuperAdmin && selectedTicket.status === 'PENDING' && (
                                <div className="admin-response-form">
                                    <label>Send Response</label>
                                    <textarea
                                        className="admin-reply-textarea"
                                        placeholder="Enter your response to this ticket..."
                                        value={adminReply}
                                        onChange={(e) => setAdminReply(e.target.value)}
                                        rows={4}
                                    />
                                    <div className="response-actions">
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
                                        <button
                                            className="btn btn-primary"
                                            onClick={handleSendResponse}
                                            disabled={submittingResponse || !adminReply.trim()}
                                        >
                                            {submittingResponse ? 'Sending...' : <><Send size={16} /> Send Response</>}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Attachment Preview Modal (POML: popup mode, inline source) */}
            {attachmentPreview.show && (
                <div className="modal-overlay attachment-preview-overlay" onClick={closeAttachmentPreview}>
                    <div className="attachment-preview-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="preview-header">
                            <div className="preview-title">
                                <FileText size={20} />
                                <span>{attachmentPreview.filename}</span>
                            </div>
                            <button className="close-btn" onClick={closeAttachmentPreview}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="preview-content">
                            {attachmentPreview.url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
                                <img src={attachmentPreview.url} alt="Attachment preview" className="preview-image" />
                            ) : attachmentPreview.url.match(/\.(pdf)$/i) ? (
                                <iframe src={attachmentPreview.url} title="PDF Preview" className="preview-iframe" />
                            ) : (
                                <div className="preview-unsupported">
                                    <FileText size={48} />
                                    <p>Preview not available for this file type</p>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => handleDownloadAttachment(attachmentPreview.url)}
                                    >
                                        <Download size={16} /> Download to View
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HelpDesk;

