import React, { useState, useEffect } from 'react';
import { ticketApi, userApi, User as UserData } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { HelpCircle, Plus, MessageCircle, CheckCircle, AlertCircle, X, Send, Download, Eye, User as UserIcon, Mail, Phone, Shield, FileText } from 'lucide-react';
import NewTicketModal from '../../components/common/NewTicketModal';
import './HelpDesk.css';
import '../../styles/AdvancedModalAnimations.css';

interface Ticket {
    id: string; // The primary ticket identifier (e.g., PV-TK-...)
    ticket_id: string; // Alias for id to maintain compatibility
    raised_by_user_id: string;
    user_full_name: string;
    user_email: string;
    user_role?: string;
    user_phone_number?: string | null;
    subject: string;
    category: string;
    description: string;
    attachment: string | null; // R2 object key
    status: 'Open' | 'In Progress' | 'Closed';
    assigned_user_id: string | null;
    assigned_user_name: string | null;
    assigned_user_role: string | null;
    created_at: string;
    updated_at: string;
    messages?: string; // Raw JSON from DB if not parsed
}

interface TicketMessage {
    sender_id: string;
    sender_name: string;
    sender_role: string;
    text: string;
    timestamp: string;
}

const HelpDesk: React.FC = () => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewTicket, setShowNewTicket] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [threadMessages, setThreadMessages] = useState<TicketMessage[]>([]);
    const [isClosingViewTicket, setIsClosingViewTicket] = useState(false);

    // Admin response state
    const [messageResponse, setMessageResponse] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<'Open' | 'In Progress' | 'Closed'>('Open');
    const [submittingResponse, setSubmittingResponse] = useState(false);

    // General thread reply state
    const [threadReply, setThreadReply] = useState('');
    const [submittingThreadReply, setSubmittingThreadReply] = useState(false);

    // Attachment preview modal state
    const [attachmentPreview, setAttachmentPreview] = useState<{ show: boolean; url: string; filename: string }>({
        show: false, url: '', filename: ''
    });

    // Assignable users for admins
    const [assignableUsers, setAssignableUsers] = useState<UserData[]>([]);
    const [isAssigning, setIsAssigning] = useState(false);

    const { success, error } = useToast();
    const { user } = useAuth();

    const userRole = user?.role?.toUpperCase() || 'CUSTOMER';
    const isSuperAdmin = userRole === 'SUPERADMIN';
    const isAdmin = userRole === 'ADMIN';
    const isAdminOrSuperAdmin = isAdmin || isSuperAdmin;
    const canCreateTicket = userRole !== 'SUPERADMIN';
    const isAssignedResponder = selectedTicket?.assigned_user_id === user?.id;

    useEffect(() => {
        fetchTickets();
        if (isAdminOrSuperAdmin) fetchAssignableUsers();
    }, []);

    const fetchAssignableUsers = async () => {
        try {
            const response = await userApi.getUsers();
            if (response.data.success && response.data.data) {
                // Spec says can only assign to users with Admin role
                const filtered = response.data.data.data.filter((u: UserData) => u.role?.toUpperCase() === 'ADMIN');
                setAssignableUsers(filtered);
            }
        } catch (err) { console.error('Failed to load assignable users'); }
    };

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
            setMessageResponse('');
            setThreadReply('');
            setSelectedStatus('Open');
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
            const ticketId = ticket.id; // Corrected to use id
            const response = await ticketApi.getTicketById(ticketId);
            if (response.data.success && response.data.data) {
                const fetchedTicket = response.data.data.ticket;
                // Map id to ticket_id for UI components that might still use it
                fetchedTicket.ticket_id = fetchedTicket.id;
                setSelectedTicket(fetchedTicket);
                setThreadMessages(response.data.data.messages || []);
                setMessageResponse('');
                setThreadReply('');
            }
        } catch (err: any) {
            error(err.response?.data?.message || 'Failed to load ticket');
        }
    };

    const handleSendResponse = async () => {
        if (!selectedTicket || !messageResponse.trim()) {
            error('Please enter a response message');
            return;
        }

        setSubmittingResponse(true);
        try {
            await ticketApi.updateTicketStatus(selectedTicket.ticket_id, selectedStatus, messageResponse.trim());
            success(`Ticket ${selectedStatus.toLowerCase()} successfully`);
            fetchTickets();
            closeViewTicket();
        } catch (err: any) {
            error(err.response?.data?.message || 'Failed to update ticket');
        } finally {
            setSubmittingResponse(false);
        }
    };

    const handlePostMessage = async () => {
        if (!selectedTicket || !threadReply.trim()) return;
        setSubmittingThreadReply(true);
        try {
            await ticketApi.postTicketMessage(selectedTicket.ticket_id, threadReply.trim());
            setThreadReply('');
            // Refresh thread
            const response = await ticketApi.getTicketById(selectedTicket.ticket_id);
            if (response.data.success && response.data.data) {
                setThreadMessages(response.data.data.messages || []);
            }
            success('Message posted');
        } catch (err: any) {
            error(err.response?.data?.message || 'Failed to post message');
        } finally {
            setSubmittingThreadReply(false);
        }
    };

    // Build full API URL for attachments
    const getAttachmentUrl = (path: string) => {
        const baseUrl = import.meta.env.VITE_API_URL || '';
        // Path already includes /api/helpdesk/attachments/
        return `${baseUrl}${path}`;
    };

    // Open attachment in inline modal (POML: redirect=false, mode=popup)
    const handleViewAttachment = async (path: string) => {
        const filename = path.split('/').pop() || 'attachment';
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(getAttachmentUrl(path), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to load attachment');
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            setAttachmentPreview({ show: true, url: blobUrl, filename });
        } catch (err) {
            error('Failed to load attachment');
        }
    };

    // Direct download without redirect (POML: mode=direct, redirect=false)
    const handleDownloadAttachment = async (path: string) => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(getAttachmentUrl(path), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to download');
            const blob = await response.blob();
            const filename = path.split('/').pop() || 'attachment';
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

    const handleAssignTicket = async (assignedToId: string) => {
        if (!selectedTicket) return;
        setIsAssigning(true);
        try {
            await ticketApi.assignTicket(selectedTicket.ticket_id, assignedToId);
            success('Ticket assigned successfully');
            // Refresh ticket details
            handleViewTicket(selectedTicket);
        } catch (err: any) {
            error(err.response?.data?.message || 'Failed to assign ticket');
        } finally {
            setIsAssigning(false);
        }
    };

    const closeAttachmentPreview = () => {
        // Revoke blob URL to free memory
        if (attachmentPreview.url.startsWith('blob:')) {
            window.URL.revokeObjectURL(attachmentPreview.url);
        }
        setAttachmentPreview({ show: false, url: '', filename: '' });
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Open': return <AlertCircle size={16} className="status-open" />;
            case 'In Progress': return <MessageCircle size={16} className="status-progress" />;
            case 'Closed': return <CheckCircle size={16} className="status-closed" />;
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
                        {tickets.map((t: Ticket) => (
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
                                <div className="ticket-top-meta">
                                    <span className="ticket-category-badge">{selectedTicket.category}</span>
                                    <div className="ticket-id-tag">{selectedTicket.ticket_id}</div>
                                </div>
                                <h2 className="modal-title-advanced">{selectedTicket.subject}</h2>
                                <div className="ticket-meta" style={{ marginTop: '12px' }}>
                                    <span className={`ticket-status-badge ${selectedTicket.status.toLowerCase()}`}>{selectedTicket.status}</span>
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
                                            <UserIcon size={16} />
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
                                {selectedTicket.attachment ? (
                                    <div className="attachment-actions">
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => handleViewAttachment(selectedTicket.attachment!)}
                                        >
                                            <Eye size={14} /> View
                                        </button>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => handleDownloadAttachment(selectedTicket.attachment!)}
                                        >
                                            <Download size={14} /> Download
                                        </button>
                                    </div>
                                ) : (
                                    <p className="no-attachment">No attachment provided</p>
                                )}
                            </div>

                            {/* Message Conversation Thread (Revised Spec v3.0) */}
                            <div className="ticket-messages-thread">
                                <label><MessageCircle size={16} /> Conversation History</label>
                                <div className="messages-list">
                                    {threadMessages.length > 0 ? (
                                        threadMessages.map((msg, idx) => (
                                            <div key={idx} className={`message-item ${msg.sender_id === user?.id ? 'own-message' : 'other-message'}`}>
                                                <div className="message-meta">
                                                    <span className="sender-name">{msg.sender_name}</span>
                                                    <span className="sender-role">({msg.sender_role})</span>
                                                    <span className="message-time">{new Date(msg.timestamp).toLocaleString()}</span>
                                                </div>
                                                <div className="message-text">
                                                    <p>{msg.text}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="no-messages">No messages in this thread yet.</p>
                                    )}
                                </div>
                            </div>

                            {/* Thread Reply Form (for anyone involved) */}
                            <div className="thread-reply-form">
                                <textarea
                                    className="thread-reply-textarea"
                                    placeholder="Type a message to the thread..."
                                    value={threadReply}
                                    onChange={(e) => setThreadReply(e.target.value)}
                                    rows={2}
                                />
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={handlePostMessage}
                                    disabled={submittingThreadReply || !threadReply.trim()}
                                >
                                    {submittingThreadReply ? 'Posting...' : <><Send size={14} /> Post Message</>}
                                </button>
                            </div>

                            {/* Notice for users (Optional, can be expanded) */}
                            {!isAdminOrSuperAdmin && selectedTicket.status === 'Open' && (
                                <div className="ticket-pending-notice">
                                    <AlertCircle size={20} />
                                    <span>Waiting for response from our support team...</span>
                                </div>
                            )}

                            {/* Status Update / Responder Form (Restricted per Spec) */}
                            {(isSuperAdmin || isAssignedResponder) && selectedTicket.status !== 'Closed' && (
                                <div className="admin-response-form status-update-form">
                                    <label><Shield size={16} /> Update Status (Responder Option)</label>
                                    <textarea
                                        className="admin-reply-textarea"
                                        placeholder="Optional final response message..."
                                        value={messageResponse}
                                        onChange={(e) => setMessageResponse(e.target.value)}
                                        rows={3}
                                    />
                                    <div className="response-actions">
                                        <div className="status-selector">
                                            <label>Set Status:</label>
                                            <select
                                                value={selectedStatus}
                                                onChange={(e) => setSelectedStatus(e.target.value as any)}
                                            >
                                                <option value="Open">Open</option>
                                                <option value="In Progress">In Progress</option>
                                                <option value="Closed">Closed</option>
                                            </select>
                                        </div>
                                        <button
                                            className="btn btn-primary"
                                            onClick={handleSendResponse}
                                            disabled={submittingResponse}
                                        >
                                            {submittingResponse ? 'Updating...' : <><CheckCircle size={16} /> Update Status</>}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Bottom Meta Section - POML: position="bottom" */}
                            <div className="ticket-bottom-meta-enterprise">
                                <div className="meta-row-enterprise">
                                    <div className="meta-item">
                                        <label>Assigned To</label>
                                        {selectedTicket.assigned_user_name ? (
                                            <div className="meta-value">
                                                <UserIcon size={14} />
                                                <span>{selectedTicket.assigned_user_name} ({selectedTicket.assigned_user_role})</span>
                                            </div>
                                        ) : (
                                            <div className="meta-value unassigned">Unassigned</div>
                                        )}
                                    </div>
                                    <div className="meta-item">
                                        <label>Current Status</label>
                                        <div className="meta-value">
                                            <span className={`status-text ${selectedTicket.status.toLowerCase().replace(' ', '-')}`}>{selectedTicket.status}</span>
                                        </div>
                                    </div>
                                </div>

                                {isSuperAdmin && (
                                    <div className="assign-ticket-section">
                                        <label>Assign Ticket (SuperAdmin Only)</label>
                                        <div className="assign-controls">
                                            <select
                                                className="assign-select"
                                                defaultValue={selectedTicket.assigned_user_id || ''}
                                                onChange={(e) => handleAssignTicket(e.target.value)}
                                                disabled={isAssigning}
                                            >
                                                <option value="">Select Assignee...</option>
                                                {assignableUsers.map(u => (
                                                    <option key={u.id} value={u.id}>
                                                        {u.name} ({u.role})
                                                    </option>
                                                ))}
                                            </select>
                                            {isAssigning && <div className="assign-loading-spinner" />}
                                        </div>
                                    </div>
                                )}
                            </div>
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
                            {/* Image preview */}
                            {attachmentPreview.filename.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i) ? (
                                <img src={attachmentPreview.url} alt="Attachment preview" className="preview-image" />
                            ) : /* PDF preview */
                                attachmentPreview.filename.match(/\.(pdf)$/i) ? (
                                    <iframe src={attachmentPreview.url} title="PDF Preview" className="preview-iframe" />
                                ) : /* Video preview */
                                    attachmentPreview.filename.match(/\.(mp4|webm|ogg|mov|avi)$/i) ? (
                                        <video src={attachmentPreview.url} controls className="preview-video">
                                            Your browser does not support video playback
                                        </video>
                                    ) : /* Audio preview */
                                        attachmentPreview.filename.match(/\.(mp3|wav|ogg|m4a|aac)$/i) ? (
                                            <div className="preview-audio-container">
                                                <FileText size={64} className="audio-icon" />
                                                <p className="audio-filename">{attachmentPreview.filename}</p>
                                                <audio src={attachmentPreview.url} controls className="preview-audio" />
                                            </div>
                                        ) : /* Text/Code preview attempt via iframe */
                                            attachmentPreview.filename.match(/\.(txt|json|xml|csv|log|md|html|htm|css|js|ts|jsx|tsx)$/i) ? (
                                                <iframe src={attachmentPreview.url} title="Text Preview" className="preview-iframe preview-text" />
                                            ) : (
                                                /* Generic fallback viewer for all other types */
                                                <div className="preview-generic">
                                                    <div className="generic-file-icon">
                                                        <FileText size={64} />
                                                    </div>
                                                    <p className="generic-filename">{attachmentPreview.filename}</p>
                                                    <p className="generic-message">File preview - close to return to ticket</p>
                                                </div>
                                            )}
                        </div>
                        {/* Styled Download Button (POML: mode=direct, visible=true) */}
                        <div className="preview-footer">
                            <button
                                className="preview-download-btn"
                                onClick={() => {
                                    if (selectedTicket?.attachment) {
                                        handleDownloadAttachment(selectedTicket.attachment);
                                    }
                                    closeAttachmentPreview();
                                }}
                            >
                                <Download size={16} /> Download
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HelpDesk;

