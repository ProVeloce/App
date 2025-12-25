import { Role } from '@prisma/client';

// Define our JWT payload structure
interface JWTPayload {
    userId: string;
    email: string;
    role: Role;
    iat?: number;
    exp?: number;
}

// Define the full user from Prisma (for passport callback)
interface PassportUser {
    id: string;
    email: string;
    role: Role;
    name: string;
    status: string;
    emailVerified: boolean;
    profile?: {
        avatarUrl?: string | null;
    } | null;
}

// Extend Express with our types
declare global {
    namespace Express {
        // User can be either JWTPayload (from JWT auth) or PassportUser (from OAuth)
        interface User {
            id?: string;
            userId?: string;
            email: string;
            role: Role;
            name?: string;
            status?: string;
            emailVerified?: boolean;
            profile?: {
                avatarUrl?: string | null;
            } | null;
            iat?: number;
            exp?: number;
        }
    }
}

export { JWTPayload, PassportUser };
