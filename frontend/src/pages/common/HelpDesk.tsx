import React, { useState, useEffect, useRef } from 'react';
import { ticketApi, userApi, User as UserData } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { HelpCircle, Plus, MessageCircle, CheckCircle, AlertCircle, X, Send, Download, Eye, User as UserIcon, Mail, Phone, Shield, FileText, Paperclip, Calendar, Lock } from 'lucide-react';
import NewTicketModal from '../../components/common/NewTicketModal';
import './HelpDesk.css';
import '../../styles/AdvancedModalAnimations.css';

interface TicketAttachment {
    id: string;
    filename: string;
    filetype: string;
    url: string;
    uploaded_at?: string;
}

interface Ticket {
    id: string;
    ticket_id: string;
    raised_by_user_id: string;
    user_full_name: string;
    user_email: string;
    user_role?: string;
    user_phone_number?: string | null;
    subject: string;
    category: string;
    description: string;
    attachment: string | null;
    attachments?: TicketAttachment[];
    status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
    assigned_user_id: string | null;
    assigned_user_name: string | null;
    assigned_user_role: string | null;
    created_at: string;
    updated_at: string;
    messages?: string;
    response_text?: string | null;
    responder_id?: string | null;
    edit_count?: number;
    is_edited?: number;
    org_id?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    locked_by?: string | null;
    assigned_at?: string | null;
}

interface TicketMessage {
    id?: string;
    sender_id: string;
    sender_name: string;
    sender_role: string;
    text: string;
    content?: string;
    timestamp: string;
    attachments?: string[];
}

const HelpDesk: React.FC = () => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewTicket, setShowNewTicket] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [threadMessages, setThreadMessages] = useState<TicketMessage[]>([]);
    const [isClosingViewTicket, setIsClosingViewTicket] = useState(false);

    // Message input state
    const [messageInput, setMessageInput] = useState('');
    const [submittingMessage, setSubmittingMessage] = useState(false);

    // Status update state (for reviewers)
    const [selectedStatus, setSelectedStatus] = useState<'Open' | 'In Progress' | 'Resolved' | 'Closed'>('In Progress');
    const [statusMessage, setStatusMessage] = useState('');
    const [submittingStatus, setSubmittingStatus] = useState(false);

    // Attachment preview modal state
    const [attachmentPreview, setAttachmentPreview] = useState<{ show: boolean; url: string; filename: string }>({
        show: false, url: '', filename: ''
    });

    // Assignable users for superadmin
    const [assignableUsers, setAssignableUsers] = useState<UserData[]>([]);
    const [isAssigning, setIsAssigning] = useState(false);
    const [adminSearchFilter, setAdminSearchFilter] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { success, error } = useToast();
    const { user } = useAuth();

    const userRole = user?.role?.toUpperCase() || 'CUSTOMER';
    const isSuperAdmin = userRole === 'SUPERADMIN';
    const isAdmin = userRole === 'ADMIN';
    const isAdminOrSuperAdmin = isAdmin || isSuperAdmin;
    const canCreateTicket = userRole !== 'SUPERADMIN';

    // Determine ticket raiser's role
    const ticketRaiserRole = selectedTicket?.user_role?.toUpperCase() || 'CUSTOMER';
    const isTicketRaisedByAdmin = ticketRaiserRole === 'ADMIN';

    // Rule 1: Superadmin can only assign Expert/Customer tickets (not Admin tickets)
    const canAssignTickets = isSuperAdmin && !isTicketRaisedByAdmin;

    // Rule 4: Both ticket raiser and assigned reviewer can communicate
    const isTicketRaiser = selectedTicket?.raised_by_user_id === user?.id;
    const isAssignedReviewer = selectedTicket?.assigned_user_id === user?.id;

    // Rule 5: Cannot communicate if ticket is closed
    const isTicketClosed = selectedTicket?.status === 'Closed';

    // Rule 1 & 2: Superadmin can only respond to Admin-raised tickets
    // Rule 4: Assigned reviewer can respond to assigned tickets
    const canSendMessage = !isTicketClosed && (
        isTicketRaiser || 
        isAssignedReviewer || 
        (isSuperAdmin && isTicketRaisedByAdmin)
    );

    // Can update status: Superadmin for Admin tickets, or assigned Admin for any ticket
    const canUpdateStatus = !isTicketClosed && (
        (isSuperAdmin && isTicketRaisedByAdmin) || 
        (isAdmin && isAssignedReviewer)
    );

    useEffect(() => {
        fetchTickets();
        if (isSuperAdmin) fetchAssignableUsers();
    }, []);

    useEffect(() => {
        // Scroll to bottom when messages change
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [threadMessages]);

    const fetchAssignableUsers = async () => {
        try {
            const response = await userApi.getUsers({ roles: 'ADMIN' });
            if (response.data.success && response.data.data) {
                const filtered = response.data.data.data.filter((u: UserData) => {
                    const isCorrectRole = u.role?.toUpperCase() === 'ADMIN';
                    const isActive = (u.status?.toUpperCase() === 'ACTIVE');
                    return isCorrectRole && isActive;
                });
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
            setMessageInput('');
            setStatusMessage('');
            setSelectedStatus('In Progress');
            setThreadMessages([]);
        }, 300);
    };

    const handleCreateTicket = async (data: { category: string; subject: string; description: string; attachments: File[] }): Promise<{ ticketNumber: string }> => {
        const formData = new FormData();
        formData.append('category', data.category);
        formData.append('subject', data.subject);
        formData.append('description', data.description);

        if (data.attachments && data.attachments.length > 0) {
            data.attachments.forEach(file => {
                formData.append('attachments', file);
            });
        }

        const response = await ticketApi.createTicket(formData);
        const ticketNumber = response.data?.data?.ticketNumber || response.data?.data?.ticketId || 'UNKNOWN';
        success('Ticket submitted successfully');
        fetchTickets();
        return { ticketNumber };
    };

    const handleViewTicket = async (ticket: Ticket) => {
        try {
            const ticketId = ticket.id;
            const response = await ticketApi.getTicketById(ticketId);
            if (response.data.success && response.data.data) {
                const fetchedTicket = response.data.data.ticket;
                fetchedTicket.ticket_id = fetchedTicket.id;
                setSelectedTicket(fetchedTicket);
                setThreadMessages(response.data.data.messages || []);
                setMessageInput('');
                setStatusMessage('');
            }
        } catch (err: any) {
            error(err.response?.data?.message || 'Failed to load ticket');
        }
    };

    const handleSendMessage = async () => {
        if (!selectedTicket || !messageInput.trim()) {
            error('Please enter a message');
            return;
        }

        setSubmittingMessage(true);
        try {
            await ticketApi.postTicketMessage(selectedTicket.ticket_id, messageInput.trim());
            setMessageInput('');
            // Refresh ticket details
            handleViewTicket(selectedTicket);
            success('Message sent');
        } catch (err: any) {
            error(err.response?.data?.message || 'Failed to send message');
        } finally {
            setSubmittingMessage(false);
        }
    };

    const handleUpdateStatus = async () => {
        if (!selectedTicket) return;

        setSubmittingStatus(true);
        try {
            await ticketApi.updateTicketStatus(selectedTicket.ticket_id, selectedStatus, statusMessage.trim());
            success(`Ticket ${selectedStatus.toLowerCase()} successfully`);
            fetchTickets();
            closeViewTicket();
        } catch (err: any) {
            error(err.response?.data?.message || 'Failed to update ticket');
        } finally {
            setSubmittingStatus(false);
        }
    };

    // Build full API URL for attachments
    const getAttachmentUrl = (path: string) => {
        const baseUrl = import.meta.env.VITE_API_URL || '';
        return `${baseUrl}${path}`;
    };

    const handleViewAttachment = async (urlOrPath: string) => {
        const filename = urlOrPath.split('/').pop() || 'attachment';
        try {
            const token = localStorage.getItem('accessToken');
            const url = urlOrPath.startsWith('http') ? urlOrPath : getAttachmentUrl(urlOrPath);
            const response = await fetch(url, {
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

    const handleDownloadAttachment = async (urlOrPath: string) => {
        try {
            const token = localStorage.getItem('accessToken');
            const url = urlOrPath.startsWith('http') ? urlOrPath : getAttachmentUrl(urlOrPath);
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to download');
            const blob = await response.blob();
            const filename = urlOrPath.split('/').pop() || 'attachment';
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
            if (selectedTicket.assigned_user_id) {
                await ticketApi.reassignTicket(selectedTicket.ticket_id, assignedToId);
                success('Ticket reassigned successfully');
            } else {
                await ticketApi.assignTicket(selectedTicket.ticket_id, assignedToId);
                success('Ticket assigned successfully');
            }
            handleViewTicket(selectedTicket);
        } catch (err: any) {
            error(err.response?.data?.message || 'Failed to assign ticket');
        } finally {
            setIsAssigning(false);
        }
    };

    const handleUnassignTicket = async () => {
        if (!selectedTicket) return;
        setIsAssigning(true);
        try {
            await ticketApi.unassignTicket(selectedTicket.ticket_id);
            success('Ticket unassigned successfully');
            handleViewTicket(selectedTicket);
        } catch (err: any) {
            error(err.response?.data?.message || 'Failed to unassign ticket');
        } finally {
            setIsAssigning(false);
        }
    };

    const closeAttachmentPreview = () => {
        if (attachmentPreview.url.startsWith('blob:')) {
            window.URL.revokeObjectURL(attachmentPreview.url);
        }
        setAttachmentPreview({ show: false, url: '', filename: '' });
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Open': return <AlertCircle size={16} className="status-open" />;
            case 'In Progress': return <MessageCircle size={16} className="status-progress" />;
            case 'Resolved': return <CheckCircle size={16} className="status-resolved" />;
            case 'Closed': return <CheckCircle size={16} className="status-closed" />;
            default: return <AlertCircle size={16} />;
        }
    };

    const formatRoleDisplay = (role: string) => {
        return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    };

    const formatSenderDisplay = (name: string, role: string) => {
        return `${name} - ${formatRoleDisplay(role)}`;
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
                                    <div className="ticket-subject-row">
                                        <h4>{t.subject}</h4>
                                        {(t.attachments?.length || 0) > 0 && <Paperclip size={14} className="attachment-indicator-icon" />}
                                    </div>
                                    <div className="ticket-meta">
                                        <span className="ticket-category">{t.category}</span>
                                        <span className={`ticket-status-badge ${t.status.toLowerCase().replace(' ', '-')}`}>{t.status}</span>
                                        {isAdminOrSuperAdmin && (
                                            <span className="ticket-user-badge">
                                                {t.user_full_name || 'Unknown'} - {formatRoleDisplay(t.user_role || 'Customer')}
                                            </span>
                                        )}
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
                                    {isTicketClosed && (
                                        <span className="ticket-closed-badge">
                                            <Lock size={12} /> Closed
                                        </span>
                                    )}
                                </div>
                                <h2 className="modal-title-advanced">{selectedTicket.subject}</h2>
                                <div className="ticket-meta" style={{ marginTop: '12px' }}>
                                    <span className={`ticket-status-badge ${selectedTicket.status.toLowerCase().replace(' ', '-')}`}>{selectedTicket.status}</span>
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
                                            <span>{selectedTicket.user_full_name || 'Unknown'} - {formatRoleDisplay(selectedTicket.user_role || 'Customer')}</span>
                                        </div>
                                        <div className="identity-row">
                                            <Mail size={16} />
                                            <span>{selectedTicket.user_email || 'No email'}</span>
                                        </div>
                                        <div className="identity-row contact-identity">
                                            <Phone size={16} className="contact-icon" />
                                            <span>{selectedTicket.user_phone_number || 'No contact provided'}</span>
                                        </div>
                                        <div className="identity-row">
                                            <Calendar size={16} />
                                            <span>Submitted: {new Date(selectedTicket.created_at).toLocaleString()}</span>
                                        </div>
                                        {selectedTicket.assigned_at && (
                                            <div className="identity-row">
                                                <CheckCircle size={16} />
                                                <span className="assigned-date-label">Assigned: {new Date(selectedTicket.assigned_at).toLocaleString()}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="ticket-description">
                                <label>Description</label>
                                <p>{selectedTicket.description}</p>
                            </div>

                            {/* Attachment Section */}
                            <div className="ticket-attachment">
                                <label>Attachments ({(selectedTicket.attachments?.length || 0)})</label>
                                {(selectedTicket.attachments?.length || 0) > 0 ? (
                                    <div className="attachments-grid">
                                        {selectedTicket.attachments?.map((att) => (
                                            <div key={att.id} className="attachment-card">
                                                <div className="attachment-info">
                                                    <FileText size={16} />
                                                    <span className="attachment-name" title={att.filename}>{att.filename}</span>
                                                </div>
                                                <div className="attachment-actions">
                                                    <button
                                                        className="btn btn-secondary btn-sm"
                                                        onClick={() => handleViewAttachment(att.url)}
                                                    >
                                                        <Eye size={14} />
                                                    </button>
                                                    <button
                                                        className="btn btn-secondary btn-sm"
                                                        onClick={() => handleDownloadAttachment(att.url)}
                                                    >
                                                        <Download size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : selectedTicket.attachment ? (
                                    <div className="attachment-actions legacy-attachment">
                                        <div className="attachment-info">
                                            <FileText size={16} />
                                            <span>Legacy Attachment</span>
                                        </div>
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
                                    <p className="no-attachment">No attachments provided</p>
                                )}
                            </div>

                            {/* Message Thread Section */}
                            <div className="ticket-message-thread">
                                <label>
                                    <MessageCircle size={14} /> Conversation
                                    {isTicketClosed && <span className="closed-notice">(Ticket closed - read only)</span>}
                                </label>
                                
                                <div className="message-thread-container">
                                    {/* Initial ticket message */}
                                    <div className="thread-message thread-message-user">
                                        <div className="message-sender">
                                            {formatSenderDisplay(selectedTicket.user_full_name, selectedTicket.user_role || 'Customer')}
                                        </div>
                                        <div className="message-content">{selectedTicket.description}</div>
                                        <div className="message-time">{new Date(selectedTicket.created_at).toLocaleString()}</div>
                                    </div>

                                    {/* Thread messages */}
                                    {threadMessages.map((msg, idx) => {
                                        const isSelf = msg.sender_id === user?.id;
                                        const isStaff = ['ADMIN', 'SUPERADMIN', 'ANALYST'].includes(msg.sender_role?.toUpperCase() || '');
                                        
                                        return (
                                            <div 
                                                key={msg.id || idx} 
                                                className={`thread-message ${isSelf ? 'thread-message-self' : ''} ${isStaff ? 'thread-message-staff' : 'thread-message-user'}`}
                                            >
                                                <div className="message-sender">
                                                    {formatSenderDisplay(msg.sender_name, msg.sender_role)}
                                                </div>
                                                <div className="message-content">{msg.text || msg.content}</div>
                                                <div className="message-time">{new Date(msg.timestamp).toLocaleString()}</div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Message Input - Rule 4 & 5: Both can communicate until closed */}
                                {canSendMessage ? (
                                    <div className="message-input-container">
                                        <textarea
                                            className="message-input-textarea"
                                            placeholder="Type your message..."
                                            value={messageInput}
                                            onChange={(e) => setMessageInput(e.target.value)}
                                            rows={2}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendMessage();
                                                }
                                            }}
                                        />
                                        <button
                                            className="btn btn-primary btn-send"
                                            onClick={handleSendMessage}
                                            disabled={submittingMessage || !messageInput.trim()}
                                        >
                                            {submittingMessage ? 'Sending...' : <><Send size={16} /> Send</>}
                                        </button>
                                    </div>
                                ) : isTicketClosed ? (
                                    <div className="ticket-closed-notice">
                                        <Lock size={16} />
                                        <span>This ticket is closed. No further messages can be sent.</span>
                                    </div>
                                ) : null}
                            </div>

                            {/* Status Update Form - Only for authorized responders */}
                            {canUpdateStatus && (
                                <div className="admin-response-form status-update-form">
                                    <label><CheckCircle size={16} /> Update Status</label>
                                    <textarea
                                        className="admin-reply-textarea"
                                        placeholder="Optional message with status update..."
                                        value={statusMessage}
                                        onChange={(e) => setStatusMessage(e.target.value)}
                                        rows={2}
                                    />
                                    <div className="response-actions">
                                        <div className="status-selector">
                                            <label>Set Status:</label>
                                            <select
                                                value={selectedStatus}
                                                onChange={(e) => setSelectedStatus(e.target.value as any)}
                                            >
                                                <option value="In Progress">In Progress</option>
                                                <option value="Resolved">Resolved</option>
                                                <option value="Closed">Closed</option>
                                            </select>
                                        </div>
                                        <button
                                            className="btn btn-primary"
                                            onClick={handleUpdateStatus}
                                            disabled={submittingStatus}
                                        >
                                            {submittingStatus ? 'Updating...' : <><CheckCircle size={16} /> Update Status</>}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Waiting notice for users */}
                            {!isAdminOrSuperAdmin && selectedTicket.status === 'Open' && !selectedTicket.assigned_user_id && (
                                <div className="ticket-pending-notice">
                                    <AlertCircle size={20} />
                                    <span>Waiting for assignment to a support agent...</span>
                                </div>
                            )}

                            {/* Bottom Meta Section */}
                            <div className="ticket-bottom-meta-enterprise">
                                <div className="meta-row-enterprise">
                                    <div className="meta-item">
                                        <label>Assigned To</label>
                                        {selectedTicket.assigned_user_name ? (
                                            <div className="meta-value">
                                                <UserIcon size={14} />
                                                <span>{selectedTicket.assigned_user_name} - {formatRoleDisplay(selectedTicket.assigned_user_role || 'Admin')}</span>
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

                                {/* Assignment Section - Rule 1: Only for Expert/Customer tickets */}
                                {canAssignTickets && (
                                    <div className="assign-ticket-section">
                                        <label>{selectedTicket.assigned_user_id ? 'Reassign Ticket' : 'Assign to Admin'}</label>
                                        <div className="assign-controls assign-searchable">
                                            <input
                                                type="text"
                                                className="assign-search-input"
                                                placeholder="Search admins by name..."
                                                value={adminSearchFilter}
                                                onChange={(e) => setAdminSearchFilter(e.target.value)}
                                                disabled={isAssigning}
                                            />
                                            <select
                                                className="assign-select"
                                                value={selectedTicket.assigned_user_id || ''}
                                                onChange={(e) => {
                                                    if (e.target.value === '') {
                                                        handleUnassignTicket();
                                                    } else {
                                                        handleAssignTicket(e.target.value);
                                                    }
                                                    setAdminSearchFilter('');
                                                }}
                                                disabled={isAssigning}
                                            >
                                                <option value="">-- Unassigned --</option>
                                                {assignableUsers
                                                    .filter(u => u.name?.toLowerCase().includes(adminSearchFilter.toLowerCase()))
                                                    .map(u => (
                                                        <option key={u.id} value={u.id}>
                                                            {u.name} (Admin)
                                                        </option>
                                                    ))}
                                            </select>
                                            {isAssigning && <div className="assign-loading-spinner" />}
                                        </div>
                                    </div>
                                )}

                                {/* Info for Superadmin on Admin-raised tickets */}
                                {isSuperAdmin && isTicketRaisedByAdmin && (
                                    <div className="superadmin-direct-response-notice">
                                        <Shield size={16} />
                                        <span>Admin-raised ticket: You can respond directly without assignment.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Attachment Preview Modal */}
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
                            {attachmentPreview.filename.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i) ? (
                                <img src={attachmentPreview.url} alt="Attachment preview" className="preview-image" />
                            ) : attachmentPreview.filename.match(/\.(pdf)$/i) ? (
                                <iframe src={attachmentPreview.url} title="PDF Preview" className="preview-iframe" />
                            ) : attachmentPreview.filename.match(/\.(mp4|webm|ogg|mov|avi)$/i) ? (
                                <video src={attachmentPreview.url} controls className="preview-video">
                                    Your browser does not support video playback
                                </video>
                            ) : attachmentPreview.filename.match(/\.(mp3|wav|ogg|m4a|aac)$/i) ? (
                                <div className="preview-audio-container">
                                    <FileText size={64} className="audio-icon" />
                                    <p className="audio-filename">{attachmentPreview.filename}</p>
                                    <audio src={attachmentPreview.url} controls className="preview-audio" />
                                </div>
                            ) : attachmentPreview.filename.match(/\.(txt|json|xml|csv|log|md|html|htm|css|js|ts|jsx|tsx)$/i) ? (
                                <iframe src={attachmentPreview.url} title="Text Preview" className="preview-iframe preview-text" />
                            ) : (
                                <div className="preview-generic">
                                    <div className="generic-file-icon">
                                        <FileText size={64} />
                                    </div>
                                    <p className="generic-filename">{attachmentPreview.filename}</p>
                                    <p className="generic-message">File preview - close to return to ticket</p>
                                </div>
                            )}
                        </div>
                        <div className="preview-footer">
                            <button
                                className="preview-download-btn"
                                onClick={() => {
                                    handleDownloadAttachment(attachmentPreview.url);
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
