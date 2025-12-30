import React from 'react';
import './SessionTimeoutModal.css';

interface SessionTimeoutModalProps {
    remainingTime: number; // in seconds
    onStayLoggedIn: () => void;
    onLogout: () => void;
}

const SessionTimeoutModal: React.FC<SessionTimeoutModalProps> = ({
    remainingTime,
    onStayLoggedIn,
    onLogout,
}) => {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;

    return (
        <div className="session-timeout-overlay">
            <div className="session-timeout-modal">
                <div className="timeout-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                    </svg>
                </div>
                <h2>Session Timeout Warning</h2>
                <p>Your session will expire due to inactivity in:</p>
                <div className="timeout-countdown">
                    {minutes}:{seconds.toString().padStart(2, '0')}
                </div>
                <p className="timeout-subtitle">Click "Stay Logged In" to continue your session</p>
                <div className="timeout-actions">
                    <button className="btn btn-secondary" onClick={onLogout}>
                        Logout Now
                    </button>
                    <button className="btn btn-primary" onClick={onStayLoggedIn}>
                        Stay Logged In
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SessionTimeoutModal;
