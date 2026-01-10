import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, User, setAccessToken, setRefreshToken, getAccessToken, getRefreshToken } from '../services/api';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string; requiresVerification?: boolean }>;
    signup: (name: string, email: string, phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    checkAuth: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to decode JWT token (without verification - just for reading payload)
function decodeJWT(token: string): any {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const payload = parts[1];
        // Add padding if needed
        const padded = payload.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = atob(padded);
        return JSON.parse(decoded);
    } catch {
        return null;
    }
}

// Check if JWT is expired
function isJWTExpired(token: string): boolean {
    const payload = decodeJWT(token);
    if (!payload || !payload.exp) return true;
    return payload.exp * 1000 < Date.now();
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);

    // Restore session on mount - only run once
    useEffect(() => {
        const restoreSession = async () => {
            if (isInitialized) return;

            const token = getAccessToken();
            if (!token) {
                setIsLoading(false);
                setIsInitialized(true);
                return;
            }

            // Check if token is expired
            if (isJWTExpired(token)) {
                setAccessToken(null);
                setRefreshToken(null);
                setIsLoading(false);
                setIsInitialized(true);
                return;
            }

            // Decode JWT to get user info immediately
            const payload = decodeJWT(token);
            if (payload) {
                // Create user object from JWT payload immediately
                const userFromToken: User = {
                    id: payload.userId || payload.id || '',
                    name: payload.name || '',
                    email: payload.email || '',
                    role: (payload.role?.toUpperCase() as User['role']) || 'CUSTOMER',
                    status: 'ACTIVE',
                    emailVerified: true,
                    createdAt: new Date().toISOString(),
                };

                // Set user immediately from token to prevent redirect loops
                setUser(userFromToken);
                setIsLoading(false);
                setIsInitialized(true);

                // Optionally try to fetch fresh user data from API in background
                try {
                    const response = await authApi.getCurrentUser();
                    if (response.data?.success && response.data?.data) {
                        const { user: apiUser, expertApplication } = response.data.data;
                        // Merge expertApplication into user object
                        setUser({
                            ...apiUser,
                            expertApplication,
                        });
                    }
                } catch (error) {
                    // API call failed, but we still have user from JWT - that's fine
                    console.log('Could not refresh user from API, using JWT data');
                }
            } else {
                // Invalid token
                setAccessToken(null);
                setRefreshToken(null);
                setIsLoading(false);
                setIsInitialized(true);
            }
        };

        restoreSession();
    }, [isInitialized]);

    const checkAuth = async (): Promise<User | null> => {
        // If already initialized and user exists, return immediately
        if (isInitialized && user) {
            return user;
        }

        const token = getAccessToken();

        if (!token) {
            if (!isInitialized) {
                setIsLoading(false);
                setIsInitialized(true);
            }
            return null;
        }

        // Check if token is expired
        if (isJWTExpired(token)) {
            setAccessToken(null);
            setRefreshToken(null);
            if (!isInitialized) {
                setIsLoading(false);
                setIsInitialized(true);
            }
            setUser(null);
            return null;
        }

        // Decode JWT to get user info
        const payload = decodeJWT(token);

        if (payload) {
            // Create user object from JWT payload
            const userFromToken: User = {
                id: payload.userId || payload.id || '',
                name: payload.name || '',
                email: payload.email || '',
                role: (payload.role?.toUpperCase() as User['role']) || 'CUSTOMER',
                status: 'ACTIVE',
                emailVerified: true,
                createdAt: new Date().toISOString(),
            };

            // Only update state if user changed or not initialized
            if (!user || user.id !== userFromToken.id) {
                setUser(userFromToken);
            }

            if (!isInitialized) {
                setIsLoading(false);
                setIsInitialized(true);
            }

            // Optionally try to fetch fresh user data from API (if available)
            try {
                const response = await authApi.getCurrentUser();
                if (response.data?.success && response.data?.data) {
                    const { user: apiUser, expertApplication } = response.data.data;
                    const mergedUser = { ...apiUser, expertApplication };
                    setUser(mergedUser);
                    return mergedUser;
                }
            } catch (error) {
                // API call failed, but we still have user from JWT - that's fine
                console.log('Could not refresh user from API, using JWT data');
            }
            return userFromToken;
        } else {
            // Invalid token
            setAccessToken(null);
            setRefreshToken(null);
            if (!isInitialized) {
                setIsLoading(false);
                setIsInitialized(true);
            }
            setUser(null);
            return null;
        }
    };

    const login = async (email: string, password: string) => {
        try {
            const response = await authApi.login({ email, password });

            if (response.data.success && response.data.data) {
                const { user: userData, tokens } = response.data.data;
                setAccessToken(tokens.accessToken);
                setRefreshToken(tokens.refreshToken);
                setUser(userData);
                setIsInitialized(true);
                setIsLoading(false);
                return { success: true };
            }

            return { success: false, error: response.data.message || 'Login failed' };
        } catch (error: any) {
            const errorData = error.response?.data;

            if (errorData?.requiresVerification) {
                return { success: false, error: errorData.message, requiresVerification: true };
            }

            return { success: false, error: errorData?.error || 'Login failed' };
        }
    };

    const signup = async (name: string, email: string, phone: string, password: string) => {
        try {
            const response = await authApi.signup({ name, email, phone, password });

            if (response.data.success) {
                return { success: true };
            }

            return { success: false, error: response.data.message || 'Signup failed' };
        } catch (error: any) {
            return { success: false, error: error.response?.data?.error || 'Signup failed' };
        }
    };

    const logout = async () => {
        try {
            const refreshToken = getRefreshToken();
            await authApi.logout(refreshToken || undefined);
        } catch (error) {
            // Ignore logout errors
        } finally {
            setAccessToken(null);
            setRefreshToken(null);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userName');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setUser(null);
            setIsInitialized(false);
            setIsLoading(false);
        }
    };

    const refreshUser = async () => {
        try {
            const response = await authApi.getCurrentUser();
            if (response.data.success && response.data.data) {
                const { user: apiUser, expertApplication } = response.data.data;
                setUser({ ...apiUser, expertApplication });
            }
        } catch (error) {
            // If API fails, try to get user from JWT
            const token = getAccessToken();
            if (token) {
                const payload = decodeJWT(token);
                if (payload) {
                    setUser({
                        id: payload.userId || payload.id || '',
                        name: payload.name || '',
                        email: payload.email || '',
                        role: (payload.role?.toUpperCase() as User['role']) || 'CUSTOMER',
                        status: 'ACTIVE',
                        emailVerified: true,
                        createdAt: new Date().toISOString(),
                    });
                }
            }
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                signup,
                logout,
                refreshUser,
                checkAuth,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
