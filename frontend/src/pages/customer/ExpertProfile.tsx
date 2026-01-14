import React, { useState, useEffect } from 'react';
import { User, Calendar, Clock, Send, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getAccessToken } from '../../services/api';
import { useParams, useNavigate } from 'react-router-dom';
import './ExpertProfile.css';

interface ExpertData {
    id: string;
    name: string;
    role: string;
    status: string;
    created_at: string;
}

interface TimeSlot {
    slot_label: string;
    day_type: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://backend.proveloce.com';

const ExpertProfile: React.FC = () => {
    const { expertId } = useParams<{ expertId: string }>();
    const { user } = useAuth();
    const { success, error } = useToast();
    const navigate = useNavigate();
    const token = getAccessToken();

    const [expert, setExpert] = useState<ExpertData | null>(null);
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Request form
    const [requestDate, setRequestDate] = useState('');
    const [requestDayType, setRequestDayType] = useState('');
    const [requestSlotLabel, setRequestSlotLabel] = useState('');
    const [customerNote, setCustomerNote] = useState('');

    const slotLabels: Record<string, string> = {
        '00-06': '12AM – 6AM',
        '06-12': '6AM – 12PM',
        '12-18': '12PM – 6PM',
        '18-24': '6PM – 12AM'
    };

    useEffect(() => {
        fetchExpertProfile();
    }, [expertId]);

    const fetchExpertProfile = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/experts/${expertId}/public`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setExpert(data.data?.expert || null);
                setSlots(data.data?.slots || []);
            } else {
                error('Expert not found');
                navigate('/customer/find-experts');
            }
        } catch (err) {
            console.error('Failed to fetch expert:', err);
            error('Failed to load expert profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSendRequest = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!requestDate || !requestDayType || !requestSlotLabel) {
            error('Please fill all required fields');
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(`${API_BASE}/api/connect-requests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    expertId,
                    requestedDate: requestDate,
                    requestedDayType: requestDayType,
                    requestedSlotLabel: requestSlotLabel,
                    customerNote
                })
            });

            const data = await response.json();
            if (data.success) {
                success('Connect request sent successfully!');
                navigate('/customer/my-requests');
            } else {
                error(data.error || 'Failed to send request');
            }
        } catch (err) {
            error('Failed to send connect request');
        } finally {
            setSubmitting(false);
        }
    };

    const getMinDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    const filteredSlots = slots.filter(slot =>
        !requestDayType || slot.day_type === requestDayType || slot.day_type === 'both'
    );

    if (loading) {
        return (
            <div className="expert-profile-page">
                <div className="loading-state">Loading expert profile...</div>
            </div>
        );
    }

    if (!expert) {
        return (
            <div className="expert-profile-page">
                <div className="empty-state">Expert not found</div>
            </div>
        );
    }

    return (
        <div className="expert-profile-page">
            <button className="back-btn" onClick={() => navigate('/customer/find-experts')}>
                <ArrowLeft size={18} /> Back to Search
            </button>

            <div className="profile-layout">
                {/* Expert Profile Card */}
                <div className="profile-card">
                    <div className="profile-avatar">
                        <User size={48} />
                    </div>
                    <h2>{expert.name}</h2>
                    <span className="profile-role">Expert</span>

                    <div className="profile-section">
                        <h4><Clock size={16} /> Available Time Slots</h4>
                        {slots.length === 0 ? (
                            <p className="no-slots">No time slots configured</p>
                        ) : (
                            <div className="slots-list">
                                {slots.map((slot, i) => (
                                    <div key={i} className="slot-chip">
                                        <span className="slot-day">{slot.day_type}</span>
                                        <span className="slot-time">{slotLabels[slot.slot_label] || slot.slot_label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Connect Request Form */}
                <div className="request-card">
                    <h3><Send size={20} /> Request a Connect</h3>
                    <p>Select your preferred date and time to connect with this expert</p>

                    <form onSubmit={handleSendRequest}>
                        <div className="form-group">
                            <label><Calendar size={14} /> Select Date *</label>
                            <input
                                type="date"
                                value={requestDate}
                                onChange={(e) => setRequestDate(e.target.value)}
                                min={getMinDate()}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Day Type *</label>
                            <select
                                value={requestDayType}
                                onChange={(e) => {
                                    setRequestDayType(e.target.value);
                                    setRequestSlotLabel('');
                                }}
                                required
                            >
                                <option value="">-- Select --</option>
                                <option value="weekdays">Weekdays</option>
                                <option value="weekends">Weekends</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label><Clock size={14} /> Time Slot *</label>
                            <select
                                value={requestSlotLabel}
                                onChange={(e) => setRequestSlotLabel(e.target.value)}
                                required
                                disabled={!requestDayType}
                            >
                                <option value="">-- Select Time Slot --</option>
                                {filteredSlots.map((slot, i) => (
                                    <option key={i} value={slot.slot_label}>
                                        {slotLabels[slot.slot_label] || slot.slot_label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Purpose of Connect (Optional)</label>
                            <textarea
                                value={customerNote}
                                onChange={(e) => setCustomerNote(e.target.value)}
                                rows={3}
                                placeholder="Briefly describe why you'd like to connect..."
                            />
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? 'Sending...' : 'Send Request'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ExpertProfile;
