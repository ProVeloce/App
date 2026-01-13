import React, { useEffect, useState } from 'react';
import { useError, registerGlobalErrorHandler } from '../../context/ErrorContext';
import { Info, AlertTriangle, AlertCircle, X } from 'lucide-react';
import './StatusPopup.css';
import '../../styles/AdvancedModalAnimations.css';

const StatusPopup: React.FC = () => {
    const { error, clearError, setError } = useError();
    const [isClosing, setIsClosing] = useState(false);
    const [shouldRender, setShouldRender] = useState(error.visible);

    // Register global handler for API layer
    useEffect(() => {
        registerGlobalErrorHandler(setError);
    }, [setError]);

    useEffect(() => {
        if (error.visible) {
            setShouldRender(true);
            setIsClosing(false);
        } else if (shouldRender) {
            setIsClosing(true);
            const timer = setTimeout(() => {
                setShouldRender(false);
                setIsClosing(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [error.visible, shouldRender]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(clearError, 300);
    };

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && error.visible) {
                handleClose();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [error.visible]);

    if (!shouldRender) {
        return null;
    }

    const { severity = 'Critical', title, message } = error;

    const renderIcon = () => {
        switch (severity) {
            case 'Info':
                return <Info size={36} />;
            case 'Warning':
                return <AlertTriangle size={36} />;
            case 'Critical':
            default:
                return <AlertCircle size={36} />;
        }
    };

    const displayTitle = title || (severity === 'Info' ? 'Information' : severity === 'Warning' ? 'Warning' : 'Critical Error');

    return (
        <div
            className={`status-popup-overlay modal-overlay-advanced ${isClosing ? 'closing' : ''}`}
            onClick={handleClose}
        >
            <div
                className={`status-popup-content modal-content-advanced ${isClosing ? 'closing' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    className="status-popup-close modal-close-button-advanced"
                    onClick={handleClose}
                    aria-label="Close"
                >
                    <X size={20} />
                </button>

                <div className={`status-popup-icon modal-icon-advanced ${severity}`}>
                    {renderIcon()}
                </div>

                <h2 className="status-popup-title modal-title-advanced">{displayTitle}</h2>

                <p className="status-popup-message modal-text-advanced">
                    {message || 'An unexpected error occurred. Please try again.'}
                </p>

                <button
                    className="status-popup-btn modal-button-advanced modal-button-hover"
                    onClick={handleClose}
                >
                    Understood
                </button>
            </div>
        </div>
    );
};

export default StatusPopup;
