import React, { useState, useEffect } from 'react';
import { ticketApi, userApi, User as UserData } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { HelpCircle, Plus, MessageCircle, CheckCircle, AlertCircle, X, Send, Download, Eye, User as UserIcon, Mail, Phone, Shield, FileText, Paperclip } from 'lucide-react';
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
    id: string; // The database integer ID (returned as string)
    ticket_id: string; // The primary ticket identifier (e.g., PV-TK-...)
    raised_by_user_id: string;
    user_full_name: string;
    user_email: string;
    user_role?: string;
    user_phone_number?: string | null;
    subject: string;
    category: string;
    description: string;
    attachment: string | null; // Legacy single attachment field
    attachments?: TicketAttachment[]; // Spec v3.0 multiple attachments
    status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
    assigned_user_id: string | null;
    assigned_user_name: string | null;
    assigned_user_role: string | null;
    created_at: string;
    updated_at: string;
    messages?: string; // Legacy field for old tickets
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
    const [selectedStatus, setSelectedStatus] = useState<'Open' | 'In Progress' | 'Resolved' | 'Closed'>('Open');
    const [submittingResponse, setSubmittingResponse] = useState(false);

    // General thread reply state
    const [threadReply, setThreadReply] = useState('');
    const [submittingThreadReply, setSubmittingThreadReply] = useState(false);

    // Response Editing state
    const [isEditingResponse, setIsEditingResponse] = useState(false);

    // Attachment preview modal state
    const [attachmentPreview, setAttachmentPreview] = useState<{ show: boolean; url: string; filename: string }>({
        show: false, url: '', filename: ''
    });

    // Assignable users for admins
    const [assignableUsers, setAssignableUsers] = useState<UserData[]>([]);
    const [isAssigning, setIsAssigning] = useState(false);
    const [adminSearchFilter, setAdminSearchFilter] = useState('');

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
            const response = await userApi.getUsers({ roles: 'ADMIN' });
            if (response.data.success && response.data.data) {
                // Filter by role (Admin only) and org_id (if not superadmin)
                const filtered = response.data.data.data.filter((u: UserData) => {
                    const isCorrectRole = u.role?.toUpperCase() === 'ADMIN';
                    const isSameOrg = isSuperAdmin || u.org_id === user?.org_id;
                    const isActive = (u.status?.toUpperCase() === 'ACTIVE');
                    return isCorrectRole && isSameOrg && isActive;
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
            setMessageResponse('');
            setThreadReply('');
            setSelectedStatus('Open');
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
                setMessageResponse('');
                setThreadReply('');
                setIsEditingResponse(false);
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
            // Updated to support edit_requested flag (Spec v4.0)
            await ticketApi.postTicketMessage(selectedTicket.ticket_id, threadReply.trim(), isEditingResponse);
            setThreadReply('');
            setIsEditingResponse(false);
            // Refresh ticket details
            handleViewTicket(selectedTicket);
            success(isEditingResponse ? 'Response edited' : 'Response posted');
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

    // Direct download without redirect (POML: mode=direct, redirect=false)
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
            // Refresh ticket details
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
            // Refresh ticket details
            handleViewTicket(selectedTicket);
        } catch (err: any) {
            error(err.response?.data?.message || 'Failed to unassign ticket');
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
            case 'Resolved': return <CheckCircle size={16} className="status-resolved" />;
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
                                    <div className="ticket-subject-row">
                                        <h4>{t.subject}</h4>
                                        {(t.attachments?.length || 0) > 0 && <Paperclip size={14} className="attachment-indicator-icon" />}
                                    </div>
                                    <div className="ticket-meta">
                                        <span className="ticket-category">{t.category}</span>
                                        <span className={`ticket-status-badge ${t.status.toLowerCase().replace(' ', '-')}`}>{t.status}</span>
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
                                        <div className="identity-row contact-identity">
                                            <Phone size={16} className="contact-icon" />
                                            <span>{selectedTicket.user_phone_number || 'No contact provided'}</span>
                                        </div>
                                        <div className="identity-row">
                                            <AlertCircle size={16} />
                                            <span>{new Date(selectedTicket.created_at).toLocaleString()}</span>
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

                            {/* Simplified Message View (Spec v4.0) */}
                            <div className="ticket-simplified-messages">
                                <div className="message-box raised-box">
                                    <label><UserIcon size={14} /> Raised Message</label>
                                    <p className="message-body">{selectedTicket.description}</p>
                                </div>

                                {selectedTicket.response_text && (
                                    <div className="message-box response-box">
                                        <div className="response-header">
                                            <label><MessageCircle size={14} /> Message</label>
                                            {(isAdminOrSuperAdmin || selectedTicket.responder_id === user?.id) && (selectedTicket.edit_count || 0) < 1 && (
                                                <button
                                                    className="btn-edit-inline"
                                                    onClick={() => {
                                                        setIsEditingResponse(true);
                                                        setThreadReply(selectedTicket.response_text || '');
                                                    }}
                                                >
                                                    Edit
                                                </button>
                                            )}
                                        </div>
                                        <p className="message-body">{selectedTicket.response_text}</p>
                                        {selectedTicket.is_edited === 1 && (
                                            <span className="edited-indicator">edited</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Responder Input Form (Spec v4.0: Single Response / Final Edit) */}
                            {((isAdminOrSuperAdmin && !selectedTicket.response_text) || isEditingResponse) && (
                                <div className="thread-reply-form enterprise-reply-form">
                                    <label>{isEditingResponse ? 'Edit Response (One-time only)' : 'Submit Official Response'}</label>
                                    <textarea
                                        className="thread-reply-textarea"
                                        placeholder="Type the official response here..."
                                        value={threadReply}
                                        onChange={(e) => setThreadReply(e.target.value)}
                                        rows={4}
                                    />
                                    <div className="reply-actions">
                                        {isEditingResponse && (
                                            <button className="btn btn-secondary btn-sm" onClick={() => setIsEditingResponse(false)}>Cancel</button>
                                        )}
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={handlePostMessage}
                                            disabled={submittingThreadReply || !threadReply.trim()}
                                        >
                                            {submittingThreadReply ? 'Submitting...' : isEditingResponse ? 'Save Edit' : 'Send Response'}
                                        </button>
                                    </div>
                                </div>
                            )}

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
                                    <label><CheckCircle size={16} /> Update Status</label>
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
                                                <option value="Resolved">Resolved</option>
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

                                {isAdminOrSuperAdmin && (
                                    <div className="assign-ticket-section">
                                        <label>{selectedTicket.assigned_user_id ? 'Update Assignment' : 'Assign Ticket'}</label>
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

