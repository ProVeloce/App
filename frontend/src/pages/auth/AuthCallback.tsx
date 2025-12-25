import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { setAccessToken, setRefreshToken } from '../../services/api';
import './AuthPages.css';

const AuthCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { checkAuth } = useAuth();

    useEffect(() => {
        const handleCallback = async () => {
            const accessToken = searchParams.get('accessToken');
            const refreshToken = searchParams.get('refreshToken');
            const error = searchParams.get('error');

            if (error) {
                navigate('/login?error=' + error);
                return;
            }

            if (accessToken && refreshToken) {
                setAccessToken(accessToken);
                setRefreshToken(refreshToken);
                await checkAuth();
                navigate('/dashboard');
            } else {
                navigate('/login?error=missing_tokens');
            }
        };

        handleCallback();
    }, [searchParams, navigate, checkAuth]);

    return (
        <div className="auth-page">
            <div className="auth-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div className="auth-card" style={{ textAlign: 'center' }}>
                    <div className="loading-spinner" style={{ margin: '0 auto 20px' }}></div>
                    <h2>Completing sign in...</h2>
                    <p>Please wait while we log you in.</p>
                </div>
            </div>
        </div>
    );
};

export default AuthCallback;
