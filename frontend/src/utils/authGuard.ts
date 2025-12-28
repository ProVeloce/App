/**
 * Auth Guard Utility
 * Simple utility to check if user is authenticated
 */

export const requireAuth = (): boolean => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('auth_token');
    return !!token;
};

export const getAuthToken = (): string | null => {
    return localStorage.getItem('accessToken') || localStorage.getItem('auth_token');
};

export const clearAuth = (): void => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
};
