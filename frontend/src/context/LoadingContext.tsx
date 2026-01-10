import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface LoadingContextType {
    isLoading: boolean;
    loadingMessage: string;
    showLoading: (message?: string) => void;
    hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
    const context = useContext(LoadingContext);
    if (!context) {
        throw new Error('useLoading must be used within a LoadingProvider');
    }
    return context;
};

interface LoadingProviderProps {
    children: ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('Loading ProVeloce Connect');

    const showLoading = useCallback((message: string = 'Loading ProVeloce Connect') => {
        setLoadingMessage(message);
        setIsLoading(true);
    }, []);

    const hideLoading = useCallback(() => {
        setIsLoading(false);
    }, []);

    return (
        <LoadingContext.Provider value={{ isLoading, loadingMessage, showLoading, hideLoading }}>
            {children}
        </LoadingContext.Provider>
    );
};

export default LoadingContext;
