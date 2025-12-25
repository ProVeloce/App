import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ticketApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { HelpCircle, Plus, MessageCircle, Clock, CheckCircle, AlertCircle, X } from 'lucide-react';
import './HelpDesk.css';

interface Ticket { id: string; subject: string; category: string; priority: string; status: string; createdAt: string; messages?: any[]; }

const HelpDesk: React.FC = () => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewTicket, setShowNewTicket] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const { success, error } = useToast();
    const { register, handleSubmit, reset } = useForm();

    useEffect(() => { fetchTickets(); }, []);

    const fetchTickets = async () => {
        try {
            const response = await ticketApi.getMyTickets();
            if (response.data.success && response.data.data) setTickets(response.data.data.tickets || []);
        } catch (err) { error('Failed to load tickets'); } finally { setLoading(false); }
    };

    const handleCreateTicket = async (data: any) => {
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('category', data.category);
            formData.append('priority', data.priority);
            formData.append('subject', data.subject);
            formData.append('description', data.description);
            await ticketApi.createTicket(formData);
            success('Ticket created');
            setShowNewTicket(false);
            reset();
            fetchTickets();
        } catch (err) { error('Failed to create ticket'); } finally { setSubmitting(false); }
    };

    const handleViewTicket = async (ticket: Ticket) => {
        try {
            const response = await ticketApi.getTicketById(ticket.id);
            if (response.data.success && response.data.data) setSelectedTicket(response.data.data.ticket);
        } catch (err) { error('Failed to load ticket'); }
    };

    return (
        <div className="helpdesk-page">
            <div className="page-header">
                <div className="header-left"><h1><HelpCircle size={24} /> Help Desk</h1><p>Get support</p></div>
                <button className="btn btn-primary" onClick={() => setShowNewTicket(true)}><Plus size={18} /> New Ticket</button>
            </div>
            <div className="tickets-container">
                {loading ? <div className="loading-state"><div className="loading-spinner" /></div> : tickets.length === 0 ? (
                    <div className="empty-state"><MessageCircle size={48} /><h3>No tickets</h3><p>Create a ticket to get support</p></div>
                ) : (
                    <div className="tickets-list">
                        {tickets.map((t) => (
                            <div key={t.id} className="ticket-item" onClick={() => handleViewTicket(t)}>
                                <div className="ticket-status">{t.status === 'OPEN' ? <AlertCircle size={16} /> : t.status === 'IN_PROGRESS' ? <Clock size={16} /> : <CheckCircle size={16} />}</div>
                                <div className="ticket-content"><h4>{t.subject}</h4><div className="ticket-meta"><span>{t.category}</span><span className={`ticket-priority ${t.priority.toLowerCase()}`}>{t.priority}</span></div></div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {showNewTicket && (
                <div className="modal-overlay" onClick={() => setShowNewTicket(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header"><h2>New Ticket</h2><button className="close-btn" onClick={() => setShowNewTicket(false)}><X size={20} /></button></div>
                        <form onSubmit={handleSubmit(handleCreateTicket)} className="modal-form">
                            <div className="form-group"><label>Category</label><select {...register('category', { required: true })}><option value="">Select</option><option value="ACCOUNT">Account</option><option value="TECHNICAL">Technical</option><option value="GENERAL">General</option></select></div>
                            <div className="form-group"><label>Priority</label><select {...register('priority', { required: true })}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option></select></div>
                            <div className="form-group"><label>Subject</label><input type="text" {...register('subject', { required: true })} /></div>
                            <div className="form-group"><label>Description</label><textarea rows={4} {...register('description', { required: true })} /></div>
                            <div className="modal-actions"><button type="button" className="btn btn-ghost" onClick={() => setShowNewTicket(false)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Creating...' : 'Create'}</button></div>
                        </form>
                    </div>
                </div>
            )}
            {selectedTicket && (
                <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header"><h2>{selectedTicket.subject}</h2><button className="close-btn" onClick={() => setSelectedTicket(null)}><X size={20} /></button></div>
                        <div className="ticket-messages"><p className="no-messages">Waiting for response...</p></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HelpDesk;
