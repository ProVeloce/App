import React, { useState, useEffect } from 'react';
import { ticketApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { HelpCircle, Plus, MessageCircle, Clock, CheckCircle, AlertCircle, X } from 'lucide-react';
import NewTicketModal from '../../components/common/NewTicketModal';
import './HelpDesk.css';
import '../../styles/AdvancedModalAnimations.css';

interface Ticket { id: string; subject: string; category: string; priority: string; status: string; createdAt: string; messages?: any[]; }

const HelpDesk: React.FC = () => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewTicket, setShowNewTicket] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [isClosingViewTicket, setIsClosingViewTicket] = useState(false);
    const { success, error } = useToast();

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

    const handleCreateTicket = async (data: { category: string; priority: string; subject: string; description: string; attachment?: File | null }): Promise<{ ticketId: string }> => {
        const formData = new FormData();
        formData.append('category', data.category);
        formData.append('priority', data.priority);
        formData.append('subject', data.subject);
        formData.append('description', data.description);
        if (data.attachment) {
            formData.append('attachment', data.attachment);
        }
        const response = await ticketApi.createTicket(formData);
        const ticketId = response.data?.data?.ticketId || 'UNKNOWN';
        success('Ticket submitted successfully');
        fetchTickets();
        return { ticketId };
    };

    const handleViewTicket = async (ticket: Ticket) => {
        try {
            const response = await ticketApi.getTicketById(ticket.id);
            if (response.data.success && response.data.data) setSelectedTicket(response.data.data.ticket);
        } catch (err) { error('Failed to load ticket'); }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'OPEN': return <AlertCircle size={16} className="status-open" />;
            case 'IN_PROGRESS':
            case 'IN_REVIEW': return <Clock size={16} className="status-progress" />;
            case 'RESOLVED':
            case 'CLOSED': return <CheckCircle size={16} className="status-resolved" />;
            default: return <AlertCircle size={16} />;
        }
    };

    return (
        <div className="helpdesk-page">
            <div className="page-header">
                <div className="header-left">
                    <h1><HelpCircle size={24} /> Help Desk</h1>
                    <p>Get support from our team</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowNewTicket(true)}>
                    <Plus size={18} /> New Ticket
                </button>
            </div>

            <div className="tickets-container">
                {loading ? (
                    <div className="loading-state"><div className="loading-spinner" /></div>
                ) : tickets.length === 0 ? (
                    <div className="empty-state">
                        <MessageCircle size={48} />
                        <h3>No tickets yet</h3>
                        <p>Create a ticket to get support from our team</p>
                    </div>
                ) : (
                    <div className="tickets-list">
                        {tickets.map((t) => (
                            <div key={t.id} className="ticket-item" onClick={() => handleViewTicket(t)}>
                                <div className="ticket-status">{getStatusIcon(t.status)}</div>
                                <div className="ticket-content">
                                    <h4>{t.subject}</h4>
                                    <div className="ticket-meta">
                                        <span className="ticket-category">{t.category}</span>
                                        <span className={`ticket-priority ${t.priority.toLowerCase()}`}>{t.priority}</span>
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
                                <h2 className="modal-title-advanced">{selectedTicket.subject}</h2>
                                <div className="ticket-meta" style={{ marginTop: '8px' }}>
                                    <span className={`ticket-status-badge ${selectedTicket.status.toLowerCase()}`}>{selectedTicket.status}</span>
                                    <span className="ticket-category">{selectedTicket.category}</span>
                                </div>
                            </div>
                            <button className="close-btn modal-close-button-advanced" onClick={closeViewTicket}><X size={20} /></button>
                        </div>
                        <div className="ticket-messages modal-text-advanced">
                            <p className="no-messages">Waiting for response from our support team...</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HelpDesk;
