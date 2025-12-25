import React, { createContext, useContext, ReactNode } from 'react';
import toast, { Toaster, ToastOptions } from 'react-hot-toast';

interface ToastContextType {
    success: (message: string, options?: ToastOptions) => void;
    error: (message: string, options?: ToastOptions) => void;
    info: (message: string, options?: ToastOptions) => void;
    warning: (message: string, options?: ToastOptions) => void;
    loading: (message: string) => string;
    dismiss: (id?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const success = (message: string, options?: ToastOptions) => {
        toast.success(message, options);
    };

    const error = (message: string, options?: ToastOptions) => {
        toast.error(message, options);
    };

    const info = (message: string, options?: ToastOptions) => {
        toast(message, { icon: 'ℹ️', ...options });
    };

    const warning = (message: string, options?: ToastOptions) => {
        toast(message, { icon: '⚠️', ...options });
    };

    const loading = (message: string) => {
        return toast.loading(message);
    };

    const dismiss = (id?: string) => {
        if (id) {
            toast.dismiss(id);
        } else {
            toast.dismiss();
        }
    };

    return (
        <ToastContext.Provider value={{ success, error, info, warning, loading, dismiss }}>
            {children}
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 'var(--space-4)',
                        boxShadow: 'var(--shadow-lg)',
                    },
                    success: {
                        iconTheme: {
                            primary: 'var(--success-500)',
                            secondary: 'white',
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: 'var(--error-500)',
                            secondary: 'white',
                        },
                    },
                }}
            />
        </ToastContext.Provider>
    );
};

export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
