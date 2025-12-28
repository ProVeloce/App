import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { setAccessToken } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './AuthPages.css';

const AuthSuccess: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { checkAuth } = useAuth();
    const [message, setMessage] = useState('Login successful! Redirecting...');

    useEffect(() => {
        const handleAuth = async () => {
            const token = searchParams.get('token');
            const email = searchParams.get('email');
            const name = searchParams.get('name');
            const error = searchParams.get('error');

            if (error) {
                setMessage(`Authentication failed: ${error}`);
                setTimeout(() => navigate('/login', { replace: true }), 2000);
                return;
            }

            if (token) {
                // Store token in localStorage using the api helper
                setAccessToken(token);

                // Also store as auth_token for compatibility
                localStorage.setItem('auth_token', token);

                // Store user info if available
                if (email) localStorage.setItem('userEmail', email);
                if (name) localStorage.setItem('userName', name);

                // IMPORTANT: Refresh auth state before redirecting
                const user = await checkAuth();

                // Role-based redirect
                const role = user?.role?.toUpperCase() || 'CUSTOMER';
                let redirectPath = '/dashboard';

                if (role === 'SUPERADMIN') {
                    redirectPath = '/superadmin/dashboard';
                } else if (role === 'ADMIN') {
                    redirectPath = '/admin/dashboard';
                } else if (role === 'ANALYST') {
                    redirectPath = '/analyst/dashboard';
                } else if (role === 'EXPERT') {
                    redirectPath = '/expert/dashboard';
                }

                navigate(redirectPath, { replace: true });
            } else {
                setMessage('No token received. Redirecting to login...');
                setTimeout(() => navigate('/login', { replace: true }), 2000);
            }
        };

        handleAuth();
    }, [searchParams, navigate, checkAuth]);

    return (
        <div className="auth-page">
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                flexDirection: 'column',
                fontSize: '22px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white'
            }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>✔</div>
                <span>{message}</span>
            </div>
        </div>
    );
};

export default AuthSuccess;
