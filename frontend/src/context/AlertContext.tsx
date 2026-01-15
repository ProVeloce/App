import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    AlertTriangle,
    AlertCircle,
    CheckCircle,
    Info,
    X,
    Loader2
} from 'lucide-react';
import './AlertContext.css';

// Alert types
export type AlertType = 'info' | 'success' | 'warning' | 'error' | 'confirm';

export interface AlertOptions {
    title: string;
    message: string;
    type?: AlertType;
    confirmText?: string;
    cancelText?: string;
    showCancel?: boolean;
    onConfirm?: () => void | Promise<void>;
    onCancel?: () => void;
}

interface AlertState extends AlertOptions {
    id: string;
    isOpen: boolean;
    isClosing: boolean;
    isLoading: boolean;
}

interface AlertContextValue {
    // Simple alert (just OK button)
    alert: (title: string, message: string, type?: AlertType) => Promise<void>;
    
    // Confirm dialog (OK and Cancel buttons)
    confirm: (title: string, message: string, options?: Partial<AlertOptions>) => Promise<boolean>;
    
    // Full options alert
    showAlert: (options: AlertOptions) => Promise<boolean>;
    
    // Close current alert
    closeAlert: () => void;
}

const AlertContext = createContext<AlertContextValue | undefined>(undefined);

export const useAlert = (): AlertContextValue => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};

// Icon component based on type
const AlertIcon: React.FC<{ type: AlertType; isLoading?: boolean }> = ({ type, isLoading }) => {
    if (isLoading) {
        return <Loader2 size={32} className="alert-icon-spin" />;
    }
    
    switch (type) {
        case 'success':
            return <CheckCircle size={32} />;
        case 'warning':
            return <AlertTriangle size={32} />;
        case 'error':
            return <AlertCircle size={32} />;
        case 'confirm':
            return <AlertTriangle size={32} />;
        case 'info':
        default:
            return <Info size={32} />;
    }
};

// Alert Modal Component
const AlertModal: React.FC<{
    alert: AlertState;
    onConfirm: () => void;
    onCancel: () => void;
}> = ({ alert, onConfirm, onCancel }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const confirmButtonRef = useRef<HTMLButtonElement>(null);
    
    // Focus management and keyboard handling
    useEffect(() => {
        if (alert.isOpen && !alert.isClosing) {
            // Focus the confirm button when modal opens
            setTimeout(() => confirmButtonRef.current?.focus(), 100);
            
            // Handle escape key
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape' && !alert.isLoading) {
                    onCancel();
                }
                
                // Trap focus within modal
                if (e.key === 'Tab' && modalRef.current) {
                    const focusableElements = modalRef.current.querySelectorAll(
                        'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
                    );
                    const firstElement = focusableElements[0] as HTMLElement;
                    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
                    
                    if (e.shiftKey && document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement?.focus();
                    } else if (!e.shiftKey && document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement?.focus();
                    }
                }
            };
            
            document.addEventListener('keydown', handleKeyDown);
            
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
            
            return () => {
                document.removeEventListener('keydown', handleKeyDown);
                document.body.style.overflow = '';
            };
        }
    }, [alert.isOpen, alert.isClosing, alert.isLoading, onCancel]);
    
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && !alert.isLoading) {
            onCancel();
        }
    };
    
    const type = alert.type || 'info';
    const showCancel = alert.showCancel !== false && (type === 'confirm' || alert.showCancel);
    
    return createPortal(
        <div
            className={`alert-modal-overlay ${alert.isClosing ? 'closing' : ''}`}
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="alert-title"
            aria-describedby="alert-message"
        >
            <div 
                ref={modalRef}
                className={`alert-modal ${type} ${alert.isClosing ? 'closing' : ''}`}
            >
                <button
                    className="alert-modal-close"
                    onClick={onCancel}
                    disabled={alert.isLoading}
                    aria-label="Close alert"
                    tabIndex={0}
                >
                    <X size={20} />
                </button>
                
                <div className={`alert-modal-icon ${type} ${alert.isLoading ? 'loading' : ''}`}>
                    <AlertIcon type={type} isLoading={alert.isLoading} />
                </div>
                
                <h3 id="alert-title" className="alert-modal-title">
                    {alert.title}
                </h3>
                
                <p id="alert-message" className="alert-modal-message">
                    {alert.message}
                </p>
                
                <div className="alert-modal-actions">
                    {showCancel && (
                        <button
                            className="alert-btn alert-btn-cancel"
                            onClick={onCancel}
                            disabled={alert.isLoading}
                        >
                            {alert.cancelText || 'Cancel'}
                        </button>
                    )}
                    <button
                        ref={confirmButtonRef}
                        className={`alert-btn alert-btn-confirm ${type}`}
                        onClick={onConfirm}
                        disabled={alert.isLoading}
                    >
                        {alert.isLoading ? (
                            <>
                                <Loader2 size={16} className="alert-icon-spin" />
                                Processing...
                            </>
                        ) : (
                            alert.confirmText || 'OK'
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

// Alert Provider Component
export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [alert, setAlert] = useState<AlertState | null>(null);
    const resolveRef = useRef<((value: boolean) => void) | null>(null);
    
    const closeAlert = useCallback(() => {
        setAlert(prev => prev ? { ...prev, isClosing: true } : null);
        
        setTimeout(() => {
            setAlert(null);
            if (resolveRef.current) {
                resolveRef.current(false);
                resolveRef.current = null;
            }
        }, 300);
    }, []);
    
    const showAlert = useCallback((options: AlertOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            resolveRef.current = resolve;
            
            setAlert({
                id: Date.now().toString(),
                isOpen: true,
                isClosing: false,
                isLoading: false,
                title: options.title,
                message: options.message,
                type: options.type || 'info',
                confirmText: options.confirmText,
                cancelText: options.cancelText,
                showCancel: options.showCancel,
                onConfirm: options.onConfirm,
                onCancel: options.onCancel,
            });
        });
    }, []);
    
    const handleConfirm = useCallback(async () => {
        if (!alert) return;
        
        if (alert.onConfirm) {
            setAlert(prev => prev ? { ...prev, isLoading: true } : null);
            try {
                await alert.onConfirm();
            } catch (error) {
                console.error('Alert confirm action failed:', error);
            }
        }
        
        setAlert(prev => prev ? { ...prev, isClosing: true, isLoading: false } : null);
        
        setTimeout(() => {
            setAlert(null);
            if (resolveRef.current) {
                resolveRef.current(true);
                resolveRef.current = null;
            }
        }, 300);
    }, [alert]);
    
    const handleCancel = useCallback(() => {
        if (alert?.onCancel) {
            alert.onCancel();
        }
        closeAlert();
    }, [alert, closeAlert]);
    
    // Simple alert function
    const alertFn = useCallback((title: string, message: string, type?: AlertType): Promise<void> => {
        return showAlert({
            title,
            message,
            type: type || 'info',
            showCancel: false,
        }).then(() => {});
    }, [showAlert]);
    
    // Confirm function
    const confirmFn = useCallback((
        title: string,
        message: string,
        options?: Partial<AlertOptions>
    ): Promise<boolean> => {
        return showAlert({
            title,
            message,
            type: 'confirm',
            showCancel: true,
            confirmText: 'Confirm',
            cancelText: 'Cancel',
            ...options,
        });
    }, [showAlert]);
    
    const contextValue: AlertContextValue = {
        alert: alertFn,
        confirm: confirmFn,
        showAlert,
        closeAlert,
    };
    
    return (
        <AlertContext.Provider value={contextValue}>
            {children}
            {alert && (
                <AlertModal
                    alert={alert}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                />
            )}
        </AlertContext.Provider>
    );
};

export default AlertContext;
