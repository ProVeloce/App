import React from 'react';
import './SessionTimeoutModal.css';
import '../../styles/AdvancedModalAnimations.css';

interface SessionTimeoutModalProps {
    remainingTime: number;
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
        <div className="session-timeout-overlay modal-overlay-advanced">
            <div className="session-timeout-modal modal-content-advanced">
                <div className="timeout-icon modal-icon-advanced">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                    </svg>
                </div>
                <h2 className="modal-title-advanced">Session Timeout Warning</h2>
                <p className="modal-text-advanced">Your session will expire due to inactivity in:</p>
                <div className="timeout-countdown modal-text-advanced">
                    {minutes}:{seconds.toString().padStart(2, '0')}
                </div>
                <p className="timeout-subtitle modal-text-advanced">Click "Stay Logged In" to continue your session</p>
                <div className="timeout-actions modal-buttons-advanced">
                    <button className="btn btn-secondary modal-button-advanced modal-button-hover" onClick={onLogout}>
                        Logout Now
                    </button>
                    <button className="btn btn-primary modal-button-advanced modal-button-hover success-action" onClick={onStayLoggedIn}>
                        Stay Logged In
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SessionTimeoutModal;
