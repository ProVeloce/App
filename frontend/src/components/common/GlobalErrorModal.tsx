import React, { useEffect, useState } from 'react';
import { useError, registerGlobalErrorHandler } from '../../context/ErrorContext';
import { AlertTriangle, X } from 'lucide-react';
import './GlobalErrorModal.css';
import '../../styles/AdvancedModalAnimations.css';

const GlobalErrorModal: React.FC = () => {
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

    return (
        <div className={`error-modal-overlay modal-overlay-advanced ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
            <div className={`error-modal modal-content-advanced ${isClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
                <button className="error-modal-close modal-close-button-advanced" onClick={handleClose} aria-label="Close">
                    <X size={20} />
                </button>

                <div className="error-modal-icon modal-icon-advanced">
                    <AlertTriangle size={48} />
                </div>

                <h2 className="error-modal-title modal-title-advanced">{error.title || 'Error'}</h2>

                <p className="error-modal-message modal-text-advanced">
                    {error.message || 'An unexpected error occurred. Please try again.'}
                </p>

                <button className="error-modal-button modal-button-advanced modal-button-hover" onClick={handleClose}>
                    Understood
                </button>
            </div>
        </div>
    );
};

export default GlobalErrorModal;
