import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface RoleRouteProps {
    allowedRoles: string[];
}

const RoleRoute: React.FC<RoleRouteProps> = ({ allowedRoles }) => {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

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

    return <Outlet />;
};

export default RoleRoute;
