import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import './RejectExpertModal.css';
import '../../styles/AdvancedModalAnimations.css';

interface RejectExpertModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => Promise<void>;
    isLoading?: boolean;
    expertEmail?: string;
}

const RejectExpertModal: React.FC<RejectExpertModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    isLoading = false,
    expertEmail
}) => {
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    const [isClosing, setIsClosing] = useState(false);
    const [shouldRender, setShouldRender] = useState(isOpen);

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            setIsClosing(false);
            setReason('');
            setError('');
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) {
            setError('Please provide a reason for rejection');
            return;
        }
        await onConfirm(reason);
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && !isLoading) {
            onClose();
        }
    };

    return (
        <div
            className={`reject-modal-overlay modal-overlay-advanced ${isClosing ? 'closing' : ''}`}
            onClick={handleBackdropClick}
        >
            <div className={`reject-modal modal-content-advanced ${isClosing ? 'closing' : ''}`}>
                <button
                    className="reject-modal-close modal-close-button-advanced"
                    onClick={onClose}
                    disabled={isLoading}
                    aria-label="Close"
                >
                    <X size={20} />
                </button>

                <div className={`reject-modal-icon modal-icon-advanced ${isLoading ? 'confirmed' : ''}`}>
                    <AlertTriangle size={32} />
                </div>

                <div className="reject-modal-header">
                    <h3 className="reject-modal-title modal-title-advanced">Reject Expert Application</h3>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="reject-modal-content">
                        <p className="reject-modal-description modal-text-advanced">
                            {expertEmail ? `Rejecting application for: ${expertEmail}` : 'Please enter the reason for rejection:'}
                        </p>
                        <textarea
                            className={`reject-reason-textarea modal-text-advanced ${error ? 'error' : ''}`}
                            placeholder="Type reason here..."
                            value={reason}
                            onChange={(e) => {
                                setReason(e.target.value);
                                if (error) setError('');
                            }}
                            disabled={isLoading}
                            autoFocus
                        />
                        {error && <span className="reject-error-text">{error}</span>}
                    </div>

                    <div className={`reject-modal-actions modal-buttons-advanced ${isLoading ? 'confirmed' : ''}`}>
                        <button
                            type="button"
                            className="btn btn-cancel modal-button-advanced modal-button-hover"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-confirm-reject modal-button-advanced modal-button-hover"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={16} className="spinner" />
                                    <span>Rejecting...</span>
                                </>
                            ) : (
                                'Confirm'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RejectExpertModal;
