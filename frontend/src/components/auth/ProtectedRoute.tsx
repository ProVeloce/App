import React, { ReactNode, useEffect, useState, lazy, Suspense } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAccessToken } from '../../services/api';
import { useMaintenanceMode, useConfig } from '../../context/ConfigContext';

// Lazy load MaintenancePage to avoid circular dependencies
const MaintenancePage = lazy(() => import('../../pages/common/MaintenancePage'));

interface ProtectedRouteProps {
    children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated, isLoading, user } = useAuth();
    const location = useLocation();
    const [hasToken, setHasToken] = useState<boolean | null>(null);
    const { isMaintenanceMode, message, endTime } = useMaintenanceMode();
    const { refreshConfig, liveConfig, configVersion } = useConfig();

    // Check for token synchronously to prevent redirect loops
    useEffect(() => {
        const token = getAccessToken();
        setHasToken(!!token);
    }, []);

    // Refresh config when user logs in to get latest maintenance status
    useEffect(() => {
        if (user) {
            refreshConfig();
        }
    }, [user?.id, refreshConfig]);
    
    // Log maintenance mode changes for debugging (can be removed in production)
    useEffect(() => {
        if (isMaintenanceMode) {
            console.log('[Maintenance] Mode ENABLED - checking user role bypass');
        }
    }, [isMaintenanceMode, configVersion]);

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

    // Check for maintenance mode - affects ALL roles except SUPERADMIN
    // Only SUPERADMIN can access during maintenance (full portal access)
    if (isMaintenanceMode && user) {
        const role = user.role?.toUpperCase();
        // Only SUPERADMIN bypasses maintenance mode
        const exemptRoles = ['SUPERADMIN'];
        
        if (!exemptRoles.includes(role || '')) {
            // Show full-screen maintenance page for all other roles
            // This hides all portal content including sidebar, dashboard, navigation
            return (
                <Suspense fallback={
                    <div className="loading-screen">
                        <div className="loading-spinner" />
                        <p>Loading...</p>
                    </div>
                }>
                    <MaintenancePage />
                </Suspense>
            );
        }
    }

    // If we have a token, allow navigation even if user is temporarily null
    // The auth context will restore the user from the token
    return <>{children}</>;
};

export default ProtectedRoute;
