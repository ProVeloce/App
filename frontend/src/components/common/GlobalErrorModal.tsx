import React, { useEffect } from 'react';
import { useError, registerGlobalErrorHandler } from '../../context/ErrorContext';
import { AlertTriangle, X } from 'lucide-react';
import './GlobalErrorModal.css';

const GlobalErrorModal: React.FC = () => {
    const { error, clearError, setError } = useError();

    // Register global handler for API layer
    useEffect(() => {
        registerGlobalErrorHandler(setError);
    }, [setError]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && error.visible) {
                clearError();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [error.visible, clearError]);

    if (!error.visible) {
        return null;
    }

    return (
        <div className="error-modal-overlay" onClick={clearError}>
            <div className="error-modal" onClick={(e) => e.stopPropagation()}>
                <button className="error-modal-close" onClick={clearError} aria-label="Close">
                    <X size={20} />
                </button>

                <div className="error-modal-icon">
                    <AlertTriangle size={48} />
                </div>

                <h2 className="error-modal-title">{error.title || 'Error'}</h2>

                <p className="error-modal-message">
                    {error.message || 'An unexpected error occurred. Please try again.'}
                </p>

                <button className="error-modal-button" onClick={clearError}>
                    Understood
                </button>
            </div>
        </div>
    );
};

export default GlobalErrorModal;
