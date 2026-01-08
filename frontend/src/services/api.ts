import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Types
export interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: 'CUSTOMER' | 'EXPERT' | 'ANALYST' | 'ADMIN' | 'SUPERADMIN';
    status: 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
    emailVerified: boolean;
    lastLoginAt?: string;
    createdAt: string;
    profile?: UserProfile;
}

export interface UserProfile {
    id: string;
    full_name?: string;
    phone_number?: string;
    dob?: string;
    gender?: string;
    addressLine1?: string;
    addressLine2?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
    avatarUrl?: string;
    bio?: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// Create axios instance
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api: AxiosInstance = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Token management
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
    accessToken = token;
    if (token) {
        localStorage.setItem('accessToken', token);
    } else {
        localStorage.removeItem('accessToken');
    }
};

export const getAccessToken = (): string | null => {
    if (!accessToken) {
        accessToken = localStorage.getItem('accessToken');
    }
    return accessToken;
};

export const setRefreshToken = (token: string | null) => {
    if (token) {
        localStorage.setItem('refreshToken', token);
    } else {
        localStorage.removeItem('refreshToken');
    }
};

export const getRefreshToken = (): string | null => {
    return localStorage.getItem('refreshToken');
};

// Request interceptor
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor with token refresh
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = getRefreshToken();
                if (refreshToken) {
                    const response = await axios.post('/api/auth/refresh-token', { refreshToken });
                    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data.tokens;

                    setAccessToken(newAccessToken);
                    setRefreshToken(newRefreshToken);

                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // Refresh failed, clear tokens and redirect to login
                setAccessToken(null);
                setRefreshToken(null);
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

// Auth API
export const authApi = {
    signup: (data: { name: string; email: string; phone?: string; password: string }) =>
        api.post<ApiResponse>('/auth/signup', data),

    login: (data: { email: string; password: string }) =>
        api.post<ApiResponse<{ user: User; tokens: AuthTokens }>>('/auth/login', data),

    verifyOTP: (data: { email: string; otp: string; type: string }) =>
        api.post<ApiResponse>('/auth/verify-otp', data),

    resendOTP: (data: { email: string; type: string }) =>
        api.post<ApiResponse>('/auth/resend-otp', data),

    forgotPassword: (data: { email: string }) =>
        api.post<ApiResponse>('/auth/forgot-password', data),

    resetPassword: (data: { email: string; otp: string; newPassword: string }) =>
        api.post<ApiResponse>('/auth/reset-password', data),

    changePassword: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
        api.post<ApiResponse>('/auth/change-password', data),

    getLoginHistory: () =>
        api.get<ApiResponse<{ loginHistory: any[] }>>('/auth/login-history'),

    logout: (refreshToken?: string) =>
        api.post<ApiResponse>('/auth/logout', { refreshToken }),

    getCurrentUser: () =>
        api.get<ApiResponse<{ user: User }>>('/auth/me'),
};

// User API
export const userApi = {
    getUsers: (params?: Record<string, any>) =>
        api.get<ApiResponse<PaginatedResponse<User>>>('/users', { params }),

    getUserById: (id: string) =>
        api.get<ApiResponse<{ user: User }>>(`/users/${id}`),

    updateUserRole: (id: string, role: string) =>
        api.patch<ApiResponse>(`/users/${id}/role`, { role }),

    updateUserStatus: (id: string, status: string) =>
        api.patch<ApiResponse>(`/users/${id}/status`, { status }),

    getUserStats: () =>
        api.get<ApiResponse>('/users/stats'),
};

// Admin API (for superadmin portal)
export const adminApi = {
    getUsers: (params?: Record<string, any>) =>
        api.get<ApiResponse<{ users: User[]; pagination: any }>>('/admin/users', { params }),

    getUserById: (id: string) =>
        api.get<ApiResponse<{ user: User }>>(`/admin/users/${id}`),

    createUser: (data: { name: string; email: string; phone?: string; role?: string; status?: string }) =>
        api.post<ApiResponse<{ user: User }>>('/admin/users', data),

    updateUser: (id: string, data: Partial<{ name: string; email: string; phone: string; role: string; status: string }>) =>
        api.patch<ApiResponse<{ user: User }>>(`/admin/users/${id}`, data),

    deleteUser: (id: string) =>
        api.delete<ApiResponse>(`/admin/users/${id}`),

    getStats: () =>
        api.get<ApiResponse<{
            totalUsers: number;
            admins: number;
            analysts: number;
            experts: number;
            customers: number;
            activeUsers: number;
            pendingUsers: number;
            recentUsers: User[];
        }>>('/admin/stats'),

    getLogs: (params?: Record<string, any>) =>
        api.get<ApiResponse<{ logs: any[] }>>('/admin/logs', { params }),

    getDashboard: () =>
        api.get<ApiResponse<{ stats: any }>>('/admin/stats'),
};

// Profile API
export const profileApi = {
    getMyProfile: () =>
        api.get<ApiResponse<{ user: User; profileCompletion: number }>>('/profiles/me'),

    updateMyProfile: (data: Partial<UserProfile & { name?: string; phone?: string }>) =>
        api.patch<ApiResponse<{ user: User }>>('/profiles/me', data),

    updateAvatar: (file: File) => {
        const formData = new FormData();
        formData.append('avatar', file);
        return api.post<ApiResponse<{ avatarUrl: string }>>('/profiles/me/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
};

// Expert Application API
export const applicationApi = {
    getMyApplication: () =>
        api.get<ApiResponse<{ application: any }>>('/expert-application'),

    saveDraft: (data: any) =>
        api.post<ApiResponse>('/expert-application', data),

    submitApplication: () =>
        api.post<ApiResponse>('/expert-application/submit', {}),

    getApplications: (params?: Record<string, any>) =>
        api.get<ApiResponse>('/applications', { params }),

    getApplicationById: (id: string) =>
        api.get<ApiResponse>(`/applications/${id}`),

    addComment: (id: string, data: { content: string; isInternal?: boolean }) =>
        api.post<ApiResponse>(`/applications/${id}/comments`, data),

    approveApplication: (id: string) =>
        api.post<ApiResponse>(`/applications/${id}/approve`),

    rejectApplication: (id: string, reason: string) =>
        api.post<ApiResponse>(`/applications/${id}/reject`, { reason }),

    requestClarification: (id: string, message: string) =>
        api.post<ApiResponse>(`/applications/${id}/request-clarification`, { message }),

    getApplicationStats: () =>
        api.get<ApiResponse>('/applications/stats'),
};

// Task API
export const taskApi = {
    createTask: (data: any) =>
        api.post<ApiResponse>('/tasks', data),

    getTasks: (params?: Record<string, any>) =>
        api.get<ApiResponse>('/tasks', { params }),

    getTaskById: (id: string) =>
        api.get<ApiResponse>(`/tasks/${id}`),

    updateTask: (id: string, data: any) =>
        api.patch<ApiResponse>(`/tasks/${id}`, data),

    submitWork: (id: string, data: FormData) =>
        api.post<ApiResponse>(`/tasks/${id}/submit`, data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    completeTask: (id: string) =>
        api.post<ApiResponse>(`/tasks/${id}/complete`),

    getMyTaskStats: () =>
        api.get<ApiResponse>('/tasks/my-stats'),
};

// Ticket API
export const ticketApi = {
    createTicket: (data: FormData) =>
        api.post<ApiResponse>('/tickets', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    getMyTickets: (params?: Record<string, any>) =>
        api.get<ApiResponse>('/tickets/my-tickets', { params }),

    getAllTickets: (params?: Record<string, any>) =>
        api.get<ApiResponse>('/tickets', { params }),

    getTicketById: (id: string) =>
        api.get<ApiResponse>(`/tickets/${id}`),

    addMessage: (id: string, data: FormData) =>
        api.post<ApiResponse>(`/tickets/${id}/messages`, data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    updateTicketStatus: (id: string, status: string) =>
        api.patch<ApiResponse>(`/tickets/${id}/status`, { status }),
};

// Notification API
export const notificationApi = {
    getNotifications: (params?: Record<string, any>) =>
        api.get<ApiResponse>('/notifications', { params }),

    getUnreadCount: () =>
        api.get<ApiResponse<{ unreadCount: number }>>('/notifications/count'),

    markAsRead: (id: string) =>
        api.patch<ApiResponse>(`/notifications/${id}/read`),

    markAllAsRead: () =>
        api.patch<ApiResponse>('/notifications/read-all'),
};

// Activity API
export const activityApi = {
    getMyActivity: (params?: Record<string, any>) =>
        api.get<ApiResponse>('/activity/my-activity', { params }),

    getLoginHistory: () =>
        api.get<ApiResponse>('/activity/login-history'),

    getAllActivity: (params?: Record<string, any>) =>
        api.get<ApiResponse>('/activity', { params }),
};

// Config API (SuperAdmin)
export const configApi = {
    getSystemConfig: () =>
        api.get<ApiResponse>('/config'),

    updateConfig: (key: string, value: any) =>
        api.put<ApiResponse>(`/config/${key}`, { value }),

    getFeatures: () =>
        api.get<ApiResponse>('/config/features'),

    toggleFeature: (name: string, isEnabled: boolean) =>
        api.patch<ApiResponse>(`/config/features/${name}`, { isEnabled }),
};

// Portfolio API
export const portfolioApi = {
    getMyPortfolio: () =>
        api.get<ApiResponse>('/portfolio/my-portfolio'),

    createPortfolioItem: (data: FormData) =>
        api.post<ApiResponse>('/portfolio', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    updatePortfolioItem: (id: string, data: any) =>
        api.patch<ApiResponse>(`/portfolio/${id}`, data),

    deletePortfolioItem: (id: string) =>
        api.delete<ApiResponse>(`/portfolio/${id}`),
};

// Certification API
export const certificationApi = {
    getMyCertifications: () =>
        api.get<ApiResponse>('/certifications/my-certifications'),

    createCertification: (data: FormData) =>
        api.post<ApiResponse>('/certifications', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    updateCertification: (id: string, data: any) =>
        api.patch<ApiResponse>(`/certifications/${id}`, data),

    deleteCertification: (id: string) =>
        api.delete<ApiResponse>(`/certifications/${id}`),
};

// Document API (R2 Storage)
export const documentApi = {
    upload: (formData: FormData) =>
        api.post<ApiResponse<{ document: { id: string; documentType: string; fileName: string; fileType: string; fileSize: number; reviewStatus: string } }>>('/documents/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    getMyDocuments: () =>
        api.get<ApiResponse<{ documents: any[]; count: number }>>('/documents/my-documents'),

    getDocumentUrl: (id: string) =>
        api.get<ApiResponse<{ document: any; url: string; expiresIn: number }>>(`/documents/${id}/url`),

    getExpertDocuments: (userId: string) =>
        api.get<ApiResponse<{ documents: any[]; count: number }>>(`/documents/expert/${userId}`),

    reviewDocument: (id: string, status: 'approved' | 'rejected', rejectionReason?: string) =>
        api.put<ApiResponse>(`/documents/${id}/review`, { status, rejectionReason }),

    submitDocuments: () =>
        api.post<ApiResponse<{ submittedCount: number }>>('/documents/submit'),

    deleteDocument: (id: string) =>
        api.delete<ApiResponse>(`/documents/${id}`),
};

export default api;
