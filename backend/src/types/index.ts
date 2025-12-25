import { Role } from '@prisma/client';

export interface JWTPayload {
    userId: string;
    email: string;
    role: Role;
    iat?: number;
    exp?: number;
}

export interface AuthenticatedRequest extends Request {
    user?: JWTPayload;
}

export interface PaginationQuery {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
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

export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}

export interface SignupInput {
    name: string;
    email: string;
    phone?: string;
    password: string;
}

export interface LoginInput {
    email: string;
    password: string;
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

export interface ExpertApplicationInput {
    // Personal Details
    dob?: Date;
    gender?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;

    // Expertise
    domains?: string[];
    yearsOfExperience?: number;
    summaryBio?: string;
    skills?: string[];
    hourlyRate?: number;
    projectRate?: number;
    availableDays?: string[];
    availableTimeSlots?: string[];

    // Professional History
    professionalHistory?: Array<{
        company: string;
        role: string;
        startDate: string;
        endDate?: string;
        description?: string;
    }>;

    // References
    references?: Array<{
        name: string;
        relation: string;
        phone: string;
        email: string;
        company?: string;
    }>;

    // Legal
    termsAccepted?: boolean;
    ndaAccepted?: boolean;
}

export interface TaskInput {
    title: string;
    description?: string;
    deadline?: Date;
    assignedToId: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface TicketInput {
    category: 'TECHNICAL' | 'BILLING' | 'VERIFICATION' | 'OTHER';
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    subject: string;
    description: string;
}
