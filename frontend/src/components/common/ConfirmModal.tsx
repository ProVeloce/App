import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import './ConfirmModal.css';
import '../../styles/AdvancedModalAnimations.css';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    onConfirm,
    onCancel,
    isLoading = false,
}) => {
    const [isClosing, setIsClosing] = useState(false);
    const [shouldRender, setShouldRender] = useState(isOpen);

    useEffect(() => {
        if (isOpen) {
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
    }, [isOpen, shouldRender]);

    if (!shouldRender) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && !isLoading) {
            onCancel();
        }
    };

    return (
        <div 
            className={`confirm-modal-overlay modal-overlay-advanced ${isClosing ? 'closing' : ''}`} 
            onClick={handleBackdropClick}
        >
            <div className={`confirm-modal modal-content-advanced ${variant} ${isClosing ? 'closing' : ''}`}>
                <button
                    className="confirm-modal-close modal-close-button-advanced"
                    onClick={onCancel}
                    disabled={isLoading}
                    aria-label="Close"
                >
                    <X size={20} />
                </button>

                <div className={`confirm-modal-icon modal-icon-advanced ${variant}`}>
                    <AlertTriangle size={32} />
                </div>

                <h3 className="confirm-modal-title modal-title-advanced">{title}</h3>
                <p className="confirm-modal-message modal-text-advanced">{message}</p>

                <div className="confirm-modal-actions modal-buttons-advanced">
                    <button
                        className="btn btn-outline modal-button-advanced modal-button-hover"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        {cancelText}
                    </button>
                    <button
                        className={`btn btn-${variant} modal-button-advanced modal-button-hover ${variant === 'danger' ? 'critical-action' : ''}`}
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Deleting...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
