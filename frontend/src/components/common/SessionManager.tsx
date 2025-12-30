import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSession } from '../../context/SessionContext';
import SessionTimeoutModal from './SessionTimeoutModal';
import { isRouteMapped } from '../../utils/sessionUrl';

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
        encodedToken,
        isSessionExpired,
        showTimeoutWarning,
        remainingTime,
        startSession,
        endSession,
        dismissWarning,
        encodeCurrentUrl,
    } = useSession();
    const navigate = useNavigate();
    const location = useLocation();

    // Start session when user logs in
    useEffect(() => {
        if (isAuthenticated && user && !sessionId) {
            const newSessionId = startSession();
            // Only update URL for protected routes, not public pages
            if (newSessionId && isRouteMapped(location.pathname)) {
                const encodedPath = encodeCurrentUrl(location.pathname);
                // Validate encoded path is a proper 128-char hex token
                if (encodedPath && encodedPath.length === 128 && /^[a-f0-9]+$/i.test(encodedPath)) {
                    window.history.replaceState(null, '', `/${encodedPath}`);
                }
            }
        }
    }, [isAuthenticated, user, sessionId, startSession, encodeCurrentUrl, location.pathname]);

    // Update URL when navigating to protected routes
    useEffect(() => {
        if (!isAuthenticated || !sessionId) return;

        // Skip public routes
        const publicPaths = ['/', '/login', '/signup', '/forgot-password', '/verify-otp', '/privacy', '/terms', '/auth'];
        const isPublicRoute = publicPaths.some(path =>
            location.pathname === path || location.pathname.startsWith('/auth/')
        );

        if (isPublicRoute) return;

        // Check if current path is a mapped route (should be encoded)
        if (isRouteMapped(location.pathname)) {
            const encodedPath = encodeCurrentUrl(location.pathname);
            // Validate encoded path is a proper 128-char hex token before updating URL
            if (encodedPath && encodedPath.length === 128 && /^[a-f0-9]+$/i.test(encodedPath)) {
                window.history.replaceState(null, '', `/${encodedPath}`);
            }
        }
    }, [location.pathname, isAuthenticated, sessionId, encodeCurrentUrl]);

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
