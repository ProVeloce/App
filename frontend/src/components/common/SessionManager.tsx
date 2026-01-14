import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSession } from '../../context/SessionContext';
import SessionTimeoutModal from './SessionTimeoutModal';

/**
 * SessionManager component that bridges AuthContext and SessionContext.
 * - Starts session on login
 * - Ends session on logout
 * - Shows timeout warning modal
 * - Auto-logs out on session expiry
 * - Updates URL with encoded session token
 */
const SessionManager: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, logout, isAuthenticated } = useAuth();
    const {
        sessionId,
        isSessionExpired,
        showTimeoutWarning,
        remainingTime,
        startSession,
        endSession,
        dismissWarning,
    } = useSession();
    const navigate = useNavigate();
    const location = useLocation();

    // Start session when user logs in
    useEffect(() => {
        if (isAuthenticated && user && !sessionId) {
            startSession();
        }
    }, [isAuthenticated, user, sessionId, startSession]);

    // Update URL when navigating to protected routes
    useEffect(() => {
        if (!isAuthenticated || !sessionId) return;

        // Skip public routes
        const publicPaths = ['/', '/login', '/signup', '/forgot-password', '/verify-otp', '/privacy', '/terms', '/auth'];
        const isPublicRoute = publicPaths.some(path =>
            location.pathname === path || location.pathname.startsWith('/auth/')
        );

        if (isPublicRoute) return;

        // Internal state is managed via SessionContext, no longer injecting tokens into URL
    }, [location.pathname, isAuthenticated, sessionId]);

    // End session when user logs out
    useEffect(() => {
        if (!isAuthenticated && sessionId) {
            endSession();
        }
    }, [isAuthenticated, sessionId, endSession]);

    // Auto-logout on session expiry
    useEffect(() => {
        if (isSessionExpired && isAuthenticated) {
            const performLogout = async () => {
                await logout();
                endSession();
                navigate('/login', {
                    state: { message: 'Your session has expired due to inactivity. Please log in again.' }
                });
            };
            performLogout();
        }
    }, [isSessionExpired, isAuthenticated, logout, endSession, navigate]);

    const handleStayLoggedIn = () => {
        dismissWarning();
    };

    const handleLogout = async () => {
        await logout();
        endSession();
        navigate('/login');
    };

    return (
        <>
            {children}
            {showTimeoutWarning && isAuthenticated && (
                <SessionTimeoutModal
                    remainingTime={remainingTime}
                    onStayLoggedIn={handleStayLoggedIn}
                    onLogout={handleLogout}
                />
            )}
        </>
    );
};

export default SessionManager;
