import React, { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAccessToken } from '../../services/api';

interface ProtectedRouteProps {
    children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated, isLoading, user } = useAuth();
    const location = useLocation();
    const [hasToken, setHasToken] = useState<boolean | null>(null);

    // Check for token synchronously to prevent redirect loops
    useEffect(() => {
        const token = getAccessToken();
        setHasToken(!!token);
    }, []);

    // Show loading only during initial auth check
    if (isLoading && hasToken === null) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner" />
                <p>Loading...</p>
            </div>
        );
    }

    // If we have a token but user is not loaded yet, wait a bit more
    // This prevents redirect loops during navigation
    if (hasToken && !user && isLoading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner" />
                <p>Loading...</p>
            </div>
        );
    }

    // Only redirect if we're sure there's no token AND no user
    // Having a token means we're authenticated, even if user object is temporarily null
    if (!isAuthenticated && !hasToken) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If we have a token, allow navigation even if user is temporarily null
    // The auth context will restore the user from the token
    return <>{children}</>;
};

export default ProtectedRoute;
