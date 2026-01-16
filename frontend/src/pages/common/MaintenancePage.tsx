import React, { useState, useEffect } from 'react';
import { Wrench, Clock, RefreshCw, AlertTriangle, Timer } from 'lucide-react';
import { useMaintenanceMode } from '../../context/ConfigContext';
import { formatFullDateTime } from '../../utils/dateUtils';
import './MaintenancePage.css';

const MaintenancePage: React.FC = () => {
    const { message, endTime } = useMaintenanceMode();
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [isExpired, setIsExpired] = useState<boolean>(false);

    // Live countdown timer
    useEffect(() => {
        if (!endTime) {
            setTimeLeft('');
            return;
        }

        const calculateTimeLeft = () => {
            // Parse the end time - handle various formats
            let endTimestamp: number;
            
            try {
                // Try parsing as ISO string first
                endTimestamp = new Date(endTime).getTime();
                
                // If invalid, try parsing as local datetime
                if (isNaN(endTimestamp)) {
                    // Try parsing "YYYY-MM-DD HH:mm:ss" format (IST stored in DB)
                    const parts = endTime.match(/(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):?(\d{2})?/);
                    if (parts) {
                        const [, year, month, day, hours, minutes, seconds = '0'] = parts;
                        endTimestamp = new Date(
                            parseInt(year),
                            parseInt(month) - 1,
                            parseInt(day),
                            parseInt(hours),
                            parseInt(minutes),
                            parseInt(seconds)
                        ).getTime();
                    }
                }
            } catch {
                endTimestamp = 0;
            }

            if (!endTimestamp || isNaN(endTimestamp)) {
                setTimeLeft('');
                return;
            }

            const now = new Date().getTime();
            const diff = endTimestamp - now;

            if (diff <= 0) {
                setTimeLeft('00:00:00');
                setIsExpired(true);
                return;
            }

            setIsExpired(false);
            const hours = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0');
            const minutes = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, '0');
            const seconds = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');
            setTimeLeft(`${hours}:${minutes}:${seconds}`);
        };

        // Calculate immediately
        calculateTimeLeft();

        // Update every second
        const interval = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(interval);
    }, [endTime]);

    const formatEndTimeDisplay = (endTimeStr: string | null): string | null => {
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

                    {/* Live Countdown Timer */}
                    {timeLeft && (
                        <div className={`maintenance-countdown ${isExpired ? 'expired' : ''}`}>
                            <div className="countdown-header">
                                <Timer size={20} className="countdown-icon" />
                                <span className="countdown-label">
                                    {isExpired ? 'Maintenance should be complete' : 'Time Remaining'}
                                </span>
                            </div>
                            <div className="countdown-timer">
                                <div className="timer-segment">
                                    <span className="timer-value">{timeLeft.split(':')[0]}</span>
                                    <span className="timer-unit">Hours</span>
                                </div>
                                <span className="timer-separator">:</span>
                                <div className="timer-segment">
                                    <span className="timer-value">{timeLeft.split(':')[1]}</span>
                                    <span className="timer-unit">Minutes</span>
                                </div>
                                <span className="timer-separator">:</span>
                                <div className="timer-segment">
                                    <span className="timer-value">{timeLeft.split(':')[2]}</span>
                                    <span className="timer-unit">Seconds</span>
                                </div>
                            </div>
                            {isExpired && (
                                <p className="countdown-expired-message">
                                    The scheduled maintenance period has ended. Please refresh to check if the system is back online.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Estimated end time */}
                    {endTime && (
                        <div className="maintenance-eta">
                            <Clock size={18} />
                            <div className="eta-content">
                                <span className="eta-label">Expected to be back by:</span>
                                <span className="eta-time">{formatEndTimeDisplay(endTime)}</span>
                            </div>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="maintenance-actions">
                        <button className="btn btn-primary" onClick={handleRefresh}>
                            <RefreshCw size={16} />
                            {isExpired ? 'Check if Back Online' : 'Check Status'}
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
