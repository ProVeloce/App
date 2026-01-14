import React, { useState, useEffect } from 'react';
import { Search, User, Calendar, Clock, Filter, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getAccessToken } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import './ExpertSearch.css';

interface Expert {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://backend.proveloce.com';

const ExpertSearch: React.FC = () => {
    const { user } = useAuth();
    const { error } = useToast();
    const navigate = useNavigate();
    const token = getAccessToken();

    const [experts, setExperts] = useState<Expert[]>([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [slotLabel, setSlotLabel] = useState('');
    const [dayType, setDayType] = useState('');

    const timeSlots = [
        { value: '00-06', label: '12AM – 6AM' },
        { value: '06-12', label: '6AM – 12PM' },
        { value: '12-18', label: '12PM – 6PM' },
        { value: '18-24', label: '6PM – 12AM' }
    ];

    const dayTypes = [
        { value: 'weekdays', label: 'Weekdays' },
        { value: 'weekends', label: 'Weekends' }
    ];

    useEffect(() => {
        searchExperts();
    }, []);

    const searchExperts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (slotLabel) params.append('slot_label', slotLabel);
            if (dayType) params.append('day_type', dayType);

            const response = await fetch(`${API_BASE}/api/experts/search?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setExperts(data.data?.experts || []);
            }
        } catch (err) {
            console.error('Failed to search experts:', err);
            error('Failed to search experts');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        searchExperts();
    };

    const handleViewProfile = (expertId: string) => {
        navigate(`/customer/expert/${expertId}`);
    };

    return (
        <div className="expert-search-page">
            <div className="page-header">
                <div>
                    <h1><Search size={28} /> Find Experts</h1>
                    <p>Search and connect with experts based on your preferences</p>
                </div>
            </div>

            {/* Search Filters */}
            <div className="filters-card">
                <div className="filters-header">
                    <Filter size={18} />
                    <span>Filter Experts</span>
                </div>
                <form onSubmit={handleSearch} className="filters-form">
                    <div className="filter-group">
                        <label>
                            <Clock size={14} /> Timing
                        </label>
                        <select value={slotLabel} onChange={(e) => setSlotLabel(e.target.value)}>
                            <option value="">All Times</option>
                            {timeSlots.map(slot => (
                                <option key={slot.value} value={slot.value}>{slot.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>
                            <Calendar size={14} /> Day Type
                        </label>
                        <select value={dayType} onChange={(e) => setDayType(e.target.value)}>
                            <option value="">Any Day</option>
                            {dayTypes.map(dt => (
                                <option key={dt.value} value={dt.value}>{dt.label}</option>
                            ))}
                        </select>
                    </div>
                    <button type="submit" className="btn btn-primary">
                        <Search size={16} /> Search
                    </button>
                </form>
            </div>

            {/* Expert Results */}
            <div className="experts-results">
                <h3>Available Experts ({experts.length})</h3>

                {loading ? (
                    <div className="loading-state">Loading experts...</div>
                ) : experts.length === 0 ? (
                    <div className="empty-state">
                        <User size={48} />
                        <h3>No Experts Found</h3>
                        <p>Try adjusting your filters to find available experts</p>
                    </div>
                ) : (
                    <div className="experts-grid">
                        {experts.map(expert => (
                            <div key={expert.id} className="expert-card">
                                <div className="expert-avatar">
                                    <User size={32} />
                                </div>
                                <div className="expert-info">
                                    <h4>{expert.name}</h4>
                                    <span className="expert-role">Expert</span>
                                </div>
                                <button
                                    className="btn btn-outline view-btn"
                                    onClick={() => handleViewProfile(expert.id)}
                                >
                                    View Profile <ChevronRight size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExpertSearch;
