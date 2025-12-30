import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAccessToken } from '../../services/api';

interface RoleRouteProps {
    allowedRoles: string[];
}

const RoleRoute: React.FC<RoleRouteProps> = ({ allowedRoles }) => {
    const { user, isLoading } = useAuth();
    const [hasToken, setHasToken] = useState<boolean | null>(null);

    // Check for token synchronously to prevent redirect loops
    useEffect(() => {
        const token = getAccessToken();
        setHasToken(!!token);
    }, []);

    // Show loading during initial token check (hasToken is null) - protect against race condition
    // This must check regardless of isLoading state to prevent unauthenticated access
    if (hasToken === null) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner" />
                <p>Loading...</p>
            </div>
        );
    }

    // Wait for auth to load if we have a token
    if (isLoading && hasToken) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner" />
                <p>Loading...</p>
            </div>
        );
    }


    // Only redirect to login if we're sure there's no token (hasToken is explicitly false)
    // Having a token means we're authenticated, even if user object is temporarily null
    // This check must come after the null check above to prevent unauthenticated access
    if (!user && hasToken === false) {
        return <Navigate to="/login" replace />;
    }

    // If user is loaded, check role
    if (user) {
        if (!allowedRoles.includes(user.role)) {
            // Redirect to appropriate dashboard based on role
            const roleRedirects: Record<string, string> = {
                CUSTOMER: '/dashboard',
                EXPERT: '/expert/dashboard',
                ANALYST: '/analyst/dashboard',
                ADMIN: '/admin/dashboard',
                SUPERADMIN: '/superadmin/dashboard',
            };

            return <Navigate to={roleRedirects[user.role] || '/dashboard'} replace />;
        }
    }

    // If we have a token but user is still loading, allow through
    // The ProtectedRoute will handle authentication
    return <Outlet />;
};

export default RoleRoute;
