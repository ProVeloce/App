import React, { useState, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { SessionProvider } from './context/SessionContext';
import { ErrorProvider } from './context/ErrorContext';
import { LoadingProvider } from './context/LoadingContext';
import { AlertProvider } from './context/AlertContext';
import { ConfigProvider } from './context/ConfigContext';
import SessionManager from './components/common/SessionManager';
import StatusPopup from './components/common/StatusPopup';
import CookieConsent, { getCookieConsentStatus } from './components/common/CookieConsent';
import './styles/index.css';

/**
 * Root application wrapper that handles cookie consent
 */
const RootApp: React.FC = () => {
    const [cookieConsent, setCookieConsent] = useState<'pending' | 'accepted' | 'rejected'>(
        getCookieConsentStatus()
    );

    const handleCookieAccept = useCallback(() => {
        setCookieConsent('accepted');
    }, []);

    const handleCookieReject = useCallback(() => {
        setCookieConsent('rejected');
    }, []);

    return (
        <React.StrictMode>
            <BrowserRouter>
                <ConfigProvider>
                    <ThemeProvider>
                        <ErrorProvider>
                            <LoadingProvider>
                                <AuthProvider>
                                    <SessionProvider>
                                        <ToastProvider>
                                            <AlertProvider>
                                                <SessionManager>
                                                    <App />
                                                    <StatusPopup />
                                                    <Analytics />
                                                    {/* Cookie Consent Banner - shown on first visit */}
                                                    <CookieConsent 
                                                        onAccept={handleCookieAccept}
                                                        onReject={handleCookieReject}
                                                    />
                                                </SessionManager>
                                            </AlertProvider>
                                        </ToastProvider>
                                    </SessionProvider>
                                </AuthProvider>
                            </LoadingProvider>
                        </ErrorProvider>
                    </ThemeProvider>
                </ConfigProvider>
            </BrowserRouter>
        </React.StrictMode>
    );
};

ReactDOM.createRoot(document.getElementById('root')!).render(<RootApp />);
