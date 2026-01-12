import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

// Error type
export interface AppError {
    title: string;
    message: string;
    visible: boolean;
}

// Context type
interface ErrorContextType {
    error: AppError;
    setError: (error: Omit<AppError, 'visible'>) => void;
    clearError: () => void;
}

// Default state
const defaultError: AppError = {
    title: '',
    message: '',
    visible: false,
};

// Create context
const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

// Provider component
export const ErrorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [error, setErrorState] = useState<AppError>(defaultError);

    const setError = useCallback((newError: Omit<AppError, 'visible'>) => {
        setErrorState({
            title: newError.title,
            message: newError.message,
            visible: true,
        });
    }, []);

    const clearError = useCallback(() => {
        setErrorState(defaultError);
    }, []);

    // Listen for custom 'api-error' events from axios interceptor
    useEffect(() => {
        const handleApiError = (event: CustomEvent<{ title: string; message: string }>) => {
            setError({
                title: event.detail.title,
                message: event.detail.message,
            });
        };

        window.addEventListener('api-error', handleApiError as EventListener);
        return () => {
            window.removeEventListener('api-error', handleApiError as EventListener);
        };
    }, [setError]);

    return (
        <ErrorContext.Provider value={{ error, setError, clearError }}>
            {children}
        </ErrorContext.Provider>
    );
};

// Hook to use error context
export const useError = (): ErrorContextType => {
    const context = useContext(ErrorContext);
    if (!context) {
        throw new Error('useError must be used within an ErrorProvider');
    }
    return context;
};

// Standalone function for use outside React components (e.g., in API layer)
let globalSetError: ((error: Omit<AppError, 'visible'>) => void) | null = null;

export const registerGlobalErrorHandler = (handler: (error: Omit<AppError, 'visible'>) => void) => {
    globalSetError = handler;
};

export const showGlobalError = (title: string, message: string) => {
    if (globalSetError) {
        globalSetError({ title, message });
    } else {
        console.error(`[Error] ${title}: ${message}`);
    }
};

// success notification support
let globalSetSuccess: ((error: Omit<AppError, 'visible'>) => void) | null = null;

export const registerGlobalSuccessHandler = (handler: (error: Omit<AppError, 'visible'>) => void) => {
    globalSetSuccess = handler;
};

export const showGlobalSuccess = (title: string, message: string) => {
    if (globalSetSuccess) {
        globalSetSuccess({ title, message });
    } else {
        console.log(`[Success] ${title}: ${message}`);
    }
};
