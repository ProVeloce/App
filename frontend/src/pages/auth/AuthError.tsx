import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './AuthPages.css';

const AuthError: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const error = searchParams.get('error') || 'An unknown error occurred';

    const getErrorMessage = (error: string): string => {
        const errorMessages: Record<string, string> = {
            'access_denied': 'You denied access to your account.',
            'no_code_provided': 'No authorization code was received.',
            'oauth_failed': 'OAuth authentication failed.',
            'database_not_configured': 'Server database is not configured.',
            'missing_token': 'No authentication token was received.',
            'auth_failed': 'Authentication process failed.',
        };
        return errorMessages[error] || error;
    };

    return (
        <div className="auth-page">
            <div className="auth-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <div className="auth-card" style={{ textAlign: 'center', padding: '40px', maxWidth: '400px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
                    <h2 style={{ color: '#ef4444', marginBottom: '16px' }}>Authentication Failed</h2>
                    <p style={{ color: '#6b7280', marginBottom: '24px' }}>{getErrorMessage(error)}</p>
                    <button
                        onClick={() => navigate('/login')}
                        style={{
                            padding: '12px 24px',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            cursor: 'pointer',
                            width: '100%'
                        }}
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthError;
