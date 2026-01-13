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

    const { severity = 'Critical', message } = error;

    const getSeverityConfig = () => {
        switch (severity) {
            case 'Info':
                return {
                    title: 'Information',
                    icon: <Info size={40} />,
                    titleIcon: <Info size={20} />,
                    color: '#28a745'
                };
            case 'Warning':
                return {
                    title: 'Warning',
                    icon: <AlertTriangle size={40} />,
                    titleIcon: <AlertTriangle size={20} />,
                    color: '#fd7e14'
                };
            case 'Critical':
            default:
                return {
                    title: 'Critical Error',
                    icon: <AlertCircle size={40} />,
                    titleIcon: <AlertCircle size={20} />,
                    color: '#dc3545'
                };
        }
    };

    const config = getSeverityConfig();

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
                    {config.icon}
                </div>

                <h2 className="status-popup-title modal-title-advanced">
                    <span className="title-icon-wrapper">{config.titleIcon}</span>
                    {config.title}
                </h2>

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
