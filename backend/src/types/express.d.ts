import { Role } from '@prisma/client';

// Extend Express with our types
declare global {
    namespace Express {
        // User type for authenticated requests - always has userId after auth middleware
        interface User {
            userId: string;
            email: string;
            role: Role;
            // Optional properties from Passport OAuth
            id?: string;
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

// Define our JWT payload structure (exported for use in code)
export interface JWTPayload {
    userId: string;
    email: string;
    role: Role;
    iat?: number;
    exp?: number;
}

export { };
