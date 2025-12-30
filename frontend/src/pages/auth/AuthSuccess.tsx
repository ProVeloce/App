import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { setAccessToken } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import AppLogo from '../../components/common/AppLogo';
import './AuthSuccess.css';

const AuthSuccess: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { checkAuth } = useAuth();
    const [animationComplete, setAnimationComplete] = useState(false);
    const [isError, setIsError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const handleAuth = async () => {
            const token = searchParams.get('token');
            const email = searchParams.get('email');
            const name = searchParams.get('name');
            const error = searchParams.get('error');

            if (error) {
                setIsError(true);
                setErrorMessage(error);
                setTimeout(() => navigate('/login', { replace: true }), 3000);
                return;
            }

            if (token) {
                // Store token
                setAccessToken(token);
                localStorage.setItem('auth_token', token);
                if (email) localStorage.setItem('userEmail', email);
                if (name) localStorage.setItem('userName', name);

                // Refresh auth state
                const user = await checkAuth();

                // Animation timing: circle (1.2s) + tick (0.6s) + pause (0.8s) = 2.6s
                setTimeout(() => setAnimationComplete(true), 1800);

                // Redirect after full animation
                setTimeout(() => {
                    const role = user?.role?.toUpperCase() || 'CUSTOMER';
                    let redirectPath = '/dashboard';

                    if (role === 'SUPERADMIN') redirectPath = '/superadmin/dashboard';
                    else if (role === 'ADMIN') redirectPath = '/admin/dashboard';
                    else if (role === 'ANALYST') redirectPath = '/analyst/dashboard';
                    else if (role === 'EXPERT') redirectPath = '/expert/dashboard';

                    navigate(redirectPath, { replace: true });
                }, 2600);
            } else {
                setIsError(true);
                setErrorMessage('No authentication token received');
                setTimeout(() => navigate('/login', { replace: true }), 3000);
            }
        };

        handleAuth();
    }, [searchParams, navigate, checkAuth]);

    if (isError) {
        return (
            <div className="auth-success-container error">
                <div className="error-icon">
                    <svg viewBox="0 0 52 52" className="error-svg">
                        <circle className="error-circle" cx="26" cy="26" r="24" fill="none" />
                        <path className="error-x" fill="none" d="M16 16 L36 36 M36 16 L16 36" />
                    </svg>
                </div>
                <h2 className="auth-title error-text">Authentication Failed</h2>
                <p className="auth-subtitle">{errorMessage}</p>
                <p className="redirect-text">Redirecting to login...</p>
            </div>
        );
    }

    return (
        <div className="auth-success-container">
            {/* Logo */}
            <div className="auth-success-logo">
                <AppLogo showText={true} size="large" clickable={false} />
            </div>
            
            {/* Animated Success Icon */}
            <div className="success-icon">
                <svg viewBox="0 0 52 52" className="success-svg">
                    {/* Circle - draws clockwise from bottom-left */}
                    <circle
                        className="success-circle"
                        cx="26"
                        cy="26"
                        r="24"
                        fill="none"
                    />
                    {/* Checkmark - two strokes */}
                    <path
                        className="success-check"
                        fill="none"
                        d="M14 27 L22 35 L38 19"
                    />
                </svg>

                {/* Glow effect */}
                <div className="success-glow"></div>
            </div>

            {/* Title with shimmer effect */}
            <h2 className={`auth-title ${animationComplete ? 'visible' : ''}`}>
                <span className="shimmer-text">Authentication Successful</span>
            </h2>

            {/* Subtitle */}
            <p className={`auth-subtitle ${animationComplete ? 'visible' : ''}`}>
                Welcome! Redirecting to your dashboard...
            </p>

            {/* Progress indicator */}
            <div className="progress-bar">
                <div className="progress-fill"></div>
            </div>
        </div>
    );
};

export default AuthSuccess;
