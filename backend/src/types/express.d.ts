import { Role } from '@prisma/client';

// Cloudflare Worker bindings
interface CloudflareBindings {
    proveloce_db: D1Database;
    EXPERT_DOCS: R2Bucket;
}

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

        // Cloudflare Worker environment bindings
        interface Request {
            env?: CloudflareBindings;
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
