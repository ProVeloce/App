import React, { useState, useEffect } from 'react';
import { ticketApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { HelpCircle, Plus, MessageCircle, Clock, CheckCircle, AlertCircle, X } from 'lucide-react';
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
    const { success, error } = useToast();
    const { user } = useAuth();

    // SuperAdmin cannot create tickets
    const canCreateTicket = user?.role?.toLowerCase() !== 'superadmin';

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
        console.log('[HelpDesk] Ticket creation response:', response.data);

        // Backend returns ticketId inside the data object
        const ticketNumber = response.data?.data?.ticketId || 'UNKNOWN';
        if (ticketNumber === 'UNKNOWN') {
            console.error('[HelpDesk] Ticket Number missing in response:', response.data);
        }

        success('Ticket submitted successfully');
        fetchTickets();
        return { ticketNumber };
    };

    const handleViewTicket = async (ticket: Ticket) => {
        try {
            const response = await ticketApi.getTicketById(ticket.ticket_id);
            if (response.data.success && response.data.data) {
                setSelectedTicket(response.data.data.ticket);
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to load ticket';
            error(msg);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PENDING': return <AlertCircle size={16} className="status-open" />;
            case 'APPROVED': return <CheckCircle size={16} className="status-resolved" />;
            case 'REJECTED': return <X size={16} className="status-closed" />;
            default: return <Clock size={16} className="status-progress" />;
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
                            {canCreateTicket ? 'Get support from our team' : 'View and manage support tickets'}
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
                        <p>Create a ticket to get support from our team</p>
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
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Premium New Ticket Modal */}
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
                            <div className="ticket-description">
                                <label>Description</label>
                                <p>{selectedTicket.description}</p>
                            </div>

                            {selectedTicket.attachment_url && (
                                <div className="ticket-attachment">
                                    <label>Attachment</label>
                                    <div className="attachment-actions">
                                        <a href={selectedTicket.attachment_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                                            View Attachment
                                        </a>
                                        <a href={selectedTicket.attachment_url} download className="btn btn-secondary btn-sm">
                                            Download
                                        </a>
                                    </div>
                                </div>
                            )}

                            {selectedTicket.admin_reply && (
                                <div className="ticket-admin-reply">
                                    <label>Admin Response</label>
                                    <div className="admin-reply-content">
                                        <p>{selectedTicket.admin_reply}</p>
                                    </div>
                                </div>
                            )}

                            {!selectedTicket.admin_reply && selectedTicket.status === 'PENDING' && (
                                <div className="ticket-messages">
                                    <label>Status</label>
                                    <p className="no-messages">Waiting for response from our support team...</p>
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
