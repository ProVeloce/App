import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCertificationsEnabled, useMessagingEnabled } from '../../context/ConfigContext';

interface FeatureRouteProps {
    children: ReactNode;
    feature?: 'certifications' | 'messaging';
}

/**
 * FeatureRoute - Protects routes based on feature flags
 * Admins and Superadmins always have access
 */
const FeatureRoute: React.FC<FeatureRouteProps> = ({ children, feature }) => {
    const { user } = useAuth();
    const certificationsEnabled = useCertificationsEnabled();
    const messagingEnabled = useMessagingEnabled();
    
    // Admins and Superadmins bypass feature restrictions
    const isAdminOrSuperadmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
    
    if (isAdminOrSuperadmin) {
        return <>{children}</>;
    }
    
    if (feature === 'certifications' && !certificationsEnabled) {
        return <Navigate to="/dashboard" replace />;
    }
    
    if (feature === 'messaging' && !messagingEnabled) {
        return <Navigate to="/dashboard" replace />;
    }
    
    return <>{children}</>;
};

export default FeatureRoute;
