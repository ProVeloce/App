import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { setAccessToken } from '../../services/api';
import './AuthPages.css';

const AuthSuccess: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { checkAuth } = useAuth();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Completing sign in...');

    useEffect(() => {
        const handleAuthSuccess = async () => {
            try {
                // Get token from URL params (from Google OAuth callback)
                const token = searchParams.get('token');
                const email = searchParams.get('email');
                const error = searchParams.get('error');

                if (error) {
                    setStatus('error');
                    setMessage(`Authentication failed: ${error}`);
                    setTimeout(() => navigate('/login?error=' + error), 2000);
                    return;
                }

                if (!token) {
                    setStatus('error');
                    setMessage('No authentication token received');
                    setTimeout(() => navigate('/login?error=missing_token'), 2000);
                    return;
                }

                // Store token in localStorage
                setAccessToken(token);
                localStorage.setItem('accessToken', token);

                // Also store email if provided
                if (email) {
                    localStorage.setItem('userEmail', email);
                }

                setStatus('success');
                setMessage('Login successful! Redirecting...');

                // Refresh auth state and redirect
                await checkAuth();

                // Small delay to show success message
                setTimeout(() => {
                    navigate('/dashboard');
                }, 500);

            } catch (err: any) {
                console.error('Auth success handler error:', err);
                setStatus('error');
                setMessage('An error occurred during sign in');
                setTimeout(() => navigate('/login?error=auth_failed'), 2000);
            }
        };

        handleAuthSuccess();
    }, [searchParams, navigate, checkAuth]);

    return (
        <div className="auth-page">
            <div className="auth-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <div className="auth-card" style={{ textAlign: 'center', padding: '40px' }}>
                    {status === 'loading' && (
                        <>
                            <div className="loading-spinner" style={{ margin: '0 auto 20px', width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                            <h2>{message}</h2>
                            <p>Please wait while we complete your authentication.</p>
                        </>
                    )}
                    {status === 'success' && (
                        <>
                            <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
                            <h2 style={{ color: '#22c55e' }}>{message}</h2>
                        </>
                    )}
                    {status === 'error' && (
                        <>
                            <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
                            <h2 style={{ color: '#ef4444' }}>{message}</h2>
                            <p>You will be redirected to the login page.</p>
                        </>
                    )}
                </div>
            </div>
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default AuthSuccess;
