import React from 'react';
import { Wrench, Clock, RefreshCw, AlertTriangle } from 'lucide-react';
import { useMaintenanceMode } from '../../context/ConfigContext';
import { formatFullDateTime } from '../../utils/dateUtils';
import './MaintenancePage.css';

const MaintenancePage: React.FC = () => {
    const { message, endTime } = useMaintenanceMode();

    const formatEndTime = (endTimeStr: string | null): string | null => {
        if (!endTimeStr) return null;
        return formatFullDateTime(endTimeStr);
    };

    const handleRefresh = () => {
        window.location.reload();
    };

    return (
        <div className="maintenance-page">
            <div className="maintenance-container">
                {/* Animated background elements */}
                <div className="maintenance-bg-elements">
                    <div className="bg-circle bg-circle-1"></div>
                    <div className="bg-circle bg-circle-2"></div>
                    <div className="bg-circle bg-circle-3"></div>
                </div>

                {/* Main content */}
                <div className="maintenance-content">
                    {/* Logo/Branding */}
                    <div className="maintenance-logo">
                        <div className="logo-icon">
                            <Wrench className="wrench-icon" size={48} />
                        </div>
                        <h1 className="brand-name">ProVeloce</h1>
                    </div>

                    {/* Status indicator */}
                    <div className="maintenance-status">
                        <div className="status-badge">
                            <AlertTriangle size={16} />
                            <span>Maintenance Mode</span>
                        </div>
                    </div>

                    {/* Main message */}
                    <div className="maintenance-message">
                        <h2>System Under Maintenance</h2>
                        <p className="message-text">
                            {message || 'We are currently performing scheduled maintenance to improve your experience. Please check back later.'}
                        </p>
                    </div>

                    {/* Estimated end time */}
                    {endTime && (
                        <div className="maintenance-eta">
                            <Clock size={18} />
                            <div className="eta-content">
                                <span className="eta-label">Expected to be back by:</span>
                                <span className="eta-time">{formatEndTime(endTime)}</span>
                            </div>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="maintenance-actions">
                        <button className="btn btn-primary" onClick={handleRefresh}>
                            <RefreshCw size={16} />
                            Check Status
                        </button>
                    </div>

                    {/* Additional info */}
                    <div className="maintenance-info">
                        <p>
                            We apologize for any inconvenience. If you need urgent assistance, 
                            please contact our support team.
                        </p>
                    </div>

                    {/* Animated gear decoration */}
                    <div className="maintenance-decoration">
                        <div className="gear gear-1">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"/>
                            </svg>
                        </div>
                        <div className="gear gear-2">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"/>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MaintenancePage;
