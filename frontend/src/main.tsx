import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { SessionProvider } from './context/SessionContext';
import { ErrorProvider } from './context/ErrorContext';
import { LoadingProvider } from './context/LoadingContext';
import SessionManager from './components/common/SessionManager';
import GlobalErrorModal from './components/common/GlobalErrorModal';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter>
            <ThemeProvider>
                <ErrorProvider>
                    <LoadingProvider>
                        <AuthProvider>
                            <SessionProvider>
                                <ToastProvider>
                                    <SessionManager>
                                        <App />
                                        <GlobalErrorModal />
                                    </SessionManager>
                                </ToastProvider>
                            </SessionProvider>
                        </AuthProvider>
                    </LoadingProvider>
                </ErrorProvider>
            </ThemeProvider>
        </BrowserRouter>
    </React.StrictMode>
);
