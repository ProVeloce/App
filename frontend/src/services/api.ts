import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Expert Application Status Type
export type ExpertApplicationStatus = 'NONE' | 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';

export interface ExpertApplication {
    status: ExpertApplicationStatus;
    applicationId: string | null;
    submittedAt: string | null;
    rejectionReason: string | null;
}

// Types
export interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: 'CUSTOMER' | 'EXPERT' | 'ANALYST' | 'ADMIN' | 'SUPERADMIN';
    status: 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
    org_id?: string;
    emailVerified: boolean;
    lastLoginAt?: string;
    createdAt: string;
    profile?: UserProfile;
    // Expert application state (source of truth for UI rendering)
    expertApplication?: ExpertApplication;
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
    withCredentials: true, // Important: Send cookies with requests
});

// Session timeout in seconds (15 minutes)
export const SESSION_TIMEOUT_SECONDS = 15 * 60;

// Token management - kept for backward compatibility and local state tracking
// Note: httpOnly cookies cannot be accessed directly from JavaScript
// These functions now primarily track local state for UI purposes
let accessToken: string | null = null;
let isAuthenticated: boolean = false;

export const setAccessToken = (token: string | null) => {
    accessToken = token;
    isAuthenticated = !!token;
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

export const isUserAuthenticated = (): boolean => {
    return isAuthenticated || !!getAccessToken();
};

// Clear all auth state (used on logout/session expiry)
export const clearAuthState = () => {
    accessToken = null;
    isAuthenticated = false;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
};

// Request interceptor - cookies are sent automatically with withCredentials: true
// We also include Authorization header for backward compatibility
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

// Response interceptor with token refresh and global error handling
api.interceptors.response.use(
    (response) => {
        // Check for success: false in response body
        if (response.data && response.data.success === false) {
            const { showGlobalError } = require('../context/ErrorContext');
            showGlobalError(
                'Request Failed',
                response.data.error || response.data.message || 'An unexpected error occurred',
                'Critical'
            );
        }
        return response;
    },
    async (error: AxiosError<{ error?: string; message?: string; sessionExpired?: boolean }>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean; _suppressError?: boolean };

        // Check if session expired (15 minute timeout)
        const sessionExpired = error.response?.data?.sessionExpired;
        
        // Handle 401 with token refresh (only if not already retried)
        if (error.response?.status === 401 && !originalRequest._retry) {
            // If session explicitly expired, redirect to login immediately
            if (sessionExpired) {
                clearAuthState();
                window.dispatchEvent(new CustomEvent('session-expired'));
                window.location.href = '/login?sessionExpired=true';
                return Promise.reject(error);
            }
            
            originalRequest._retry = true;

            try {
                // Try to refresh tokens - cookies are sent automatically
                const response = await axios.post(`${API_BASE_URL}/api/auth/refresh-token`, {}, {
                    withCredentials: true,
                });
                
                if (response.data?.data?.tokens) {
                    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data.tokens;

                    setAccessToken(newAccessToken);
                    setRefreshToken(newRefreshToken);

                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // Refresh failed - session has expired (15 minutes passed)
                clearAuthState();
                window.dispatchEvent(new CustomEvent('session-expired'));
                window.location.href = '/login?sessionExpired=true';
                return Promise.reject(error);
            }
        }

        // Show global error modal for all other errors (unless suppressed)
        if (!originalRequest._suppressError && error.response?.status !== 401) {
            // Determine error title based on status code
            let title = 'Something went wrong';
            const status = error.response?.status;

            if (status === 400) title = 'Invalid Request';
            else if (status === 403) title = 'Access Denied';
            else if (status === 404) title = 'Not Found';
            else if (status === 409) title = 'Conflict';
            else if (status === 422) title = 'Validation Error';
            else if (status === 429) title = 'Too Many Requests';
            else if (status && status >= 500) title = 'Server Error';
            else if (!error.response) title = 'Connection Error';

            // Get error message
            const message = error.response?.data?.error
                || error.response?.data?.message
                || error.message
                || 'An unexpected error occurred. Please try again.';

            // Dispatch custom event for global error handling
            // This is captured by ErrorContext's event listener
            window.dispatchEvent(new CustomEvent('api-error', {
                detail: { title, message }
            }));
        }

        return Promise.reject(error);
    }
);

// Auth API
export const authApi = {
    signup: (data: {
        name: string;
        email: string;
        phone?: string;
        password: string;
        profile_photo_url?: string;
        bio?: string;
        dob?: string;
    }) => api.post<ApiResponse>('/auth/signup', data),

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
        api.get<ApiResponse<{ user: User; expertApplication: ExpertApplication }>>('/auth/me'),
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
        api.get<ApiResponse<{ logs: any[]; pagination?: { page: number; limit: number; total: number; totalPages: number } }>>('/admin/logs', { params }),

    getDashboard: () =>
        api.get<ApiResponse<{ stats: any }>>('/admin/stats'),

    getAnalytics: (params?: { startDate?: string; endDate?: string; role?: string }) =>
        api.get<ApiResponse<{
            users: {
                total: number;
                byRole: Record<string, number>;
                byStatus: Record<string, number>;
                growth: { date: string; count: number }[];
            };
            tickets: {
                total: number;
                byStatus: Record<string, number>;
                byCategory: Record<string, number>;
                byPriority: Record<string, number>;
                trend: { date: string; count: number }[];
            };
            sessions: {
                total: number;
                byStatus: Record<string, number>;
                trend: { date: string; count: number }[];
            };
            activities: {
                total: number;
                byAction: Record<string, number>;
                recent: any[];
            };
            applications: {
                total: number;
                byStatus: Record<string, number>;
            };
            connects: {
                total: number;
                byStatus: Record<string, number>;
            };
            generatedAt: string;
        }>>('/admin/analytics', { params }),
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

    // Spec v2.0 Unified Review
    reviewApplication: (id: string, decision: 'approved' | 'rejected', reason?: string) =>
        api.post<ApiResponse>(`/v1/expert_applications/${id}/review`, { decision, reason }),

    // Spec v2.0 Submission
    submitExpertApplication: (data: any) =>
        api.post<ApiResponse>(`/v1/expert_applications/submit`, data),

    requestClarification: (id: string, message: string) =>
        api.post<ApiResponse>(`/applications/${id}/request-clarification`, { message }),

    getApplicationStats: () =>
        api.get<ApiResponse>('/applications/stats'),

    removeExpert: (id: string, reason: string, permanentBan: boolean = false) =>
        api.post<ApiResponse>(`/applications/${id}/remove`, { reason, permanentBan }),
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
        api.post<ApiResponse>('/helpdesk/tickets', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    getMyTickets: (params?: Record<string, any>) =>
        api.get<ApiResponse>('/helpdesk/tickets', { params }),

    getAllTickets: (params?: Record<string, any>) =>
        api.get<ApiResponse>('/helpdesk/tickets', { params }),

    getTicketById: (idOrNumber: string) =>
        api.get<ApiResponse>(`/helpdesk/tickets/${idOrNumber}`),

    addMessage: (idOrNumber: string, data: FormData) =>
        api.post<ApiResponse>(`/helpdesk/tickets/${idOrNumber}/messages`, data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    postTicketMessage: (idOrNumber: string, message: string, edit_requested?: boolean) =>
        api.post<ApiResponse>(`/helpdesk/tickets/${idOrNumber}/messages`, { message, edit_requested }),

    updateTicketStatus: (idOrNumber: string, status: string, reply?: string) =>
        api.patch<ApiResponse>(`/helpdesk/tickets/${idOrNumber}/status`, { status, reply }),

    assignTicket: (idOrNumber: string, assignedToId: string) =>
        api.patch<ApiResponse>(`/helpdesk/tickets/${idOrNumber}/assign`, { assignedToId }),

    reassignTicket: (idOrNumber: string, assignedToId: string) =>
        api.post<ApiResponse>(`/helpdesk/tickets/${idOrNumber}/reassign`, { assignedToId }),

    unassignTicket: (idOrNumber: string) =>
        api.post<ApiResponse>(`/helpdesk/tickets/${idOrNumber}/unassign`, {}),

    getStats: () =>
        api.get<ApiResponse>('/helpdesk/tickets/stats'),
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
export interface SystemConfig {
    id: string;
    category: string;
    key: string;
    value: string;
    type: 'string' | 'number' | 'boolean' | 'select' | 'datetime' | 'time';
    label: string;
    description: string;
    updated_at?: string;
    updated_by?: string;
}

export const configApi = {
    getSystemConfig: () =>
        api.get<ApiResponse<SystemConfig[]>>('/config'),

    updateConfig: (id: string, value: string) =>
        api.put<ApiResponse>(`/config/${id}`, { value }),

    bulkUpdateConfig: (configs: { id: string; value: string }[]) =>
        api.post<ApiResponse>('/config/bulk', { configs }),

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

    // Admin endpoints
    getApplicationDocuments: (applicationId: string) =>
        api.get<ApiResponse<{ documents: any[]; count: number }>>(`/admin/applications/${applicationId}/documents`),

    getAllDocuments: (params?: { status?: string }) =>
        api.get<ApiResponse<{ documents: any[]; count: number }>>('/admin/documents', { params }),
};

// Admin User Management API
export const adminUserApi = {
    getUsers: (params?: Record<string, any>) =>
        api.get<ApiResponse<{ users: any[]; pagination: any }>>('/admin/users', { params }),

    getUserById: (id: string) =>
        api.get<ApiResponse<{ 
            user: any; 
            profile?: any; 
            bookings?: any[]; 
            sessions?: any[]; 
            expertApplication?: any; 
            activityLogs?: any[];
            loginHistory?: any[];
            tickets?: any[];
            notifications?: any[];
            accountStats?: {
                totalBookings: number;
                totalSessions: number;
                totalTickets: number;
                totalActivityLogs: number;
                acceptedBookings: number;
                completedSessions: number;
                openTickets: number;
            };
            fetchedAt?: string;
        }>>(`/admin/users/${id}`),

    updateUser: (id: string, data: any) =>
        api.patch<ApiResponse>(`/admin/users/${id}`, data),

    deactivateUser: (id: string) =>
        api.delete<ApiResponse>(`/admin/users/${id}`),

    getAdminStats: () =>
        api.get<ApiResponse>('/admin/stats'),
};

export default api;
