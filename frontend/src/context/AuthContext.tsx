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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = getAccessToken();
        if (!token) {
            setIsLoading(false);
            return;
        }

        try {
            const response = await authApi.getCurrentUser();
            if (response.data.success && response.data.data) {
                setUser(response.data.data.user);
            }
        } catch (error) {
            // Token invalid, clear it
            setAccessToken(null);
            setRefreshToken(null);
        } finally {
            setIsLoading(false);
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
            setUser(null);
        }
    };

    const refreshUser = async () => {
        try {
            const response = await authApi.getCurrentUser();
            if (response.data.success && response.data.data) {
                setUser(response.data.data.user);
            }
        } catch (error) {
            // Ignore
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
