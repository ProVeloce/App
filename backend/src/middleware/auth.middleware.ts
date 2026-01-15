import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index';
import { prisma } from '../lib/prisma';
import { JWTPayload } from '../types/index';
import { Role } from '@prisma/client';

/**
 * Get access token from request
 * Priority: Cookie > Authorization header
 */
const getAccessTokenFromRequest = (req: Request): string | null => {
    // First, try to get from cookie
    if (req.cookies?.accessToken) {
        return req.cookies.accessToken;
    }
    
    // Fall back to Authorization header for backward compatibility
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }
    
    return null;
};

/**
 * Verify JWT access token
 * Reads from cookies first, then Authorization header
 */
export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const token = getAccessTokenFromRequest(req);

        if (!token) {
            res.status(401).json({ 
                success: false, 
                error: 'No token provided',
                sessionExpired: true,
            });
            return;
        }

        try {
            const decoded = jwt.verify(token, config.jwt.accessSecret) as JWTPayload;

            // Verify user still exists and is active
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: { id: true, email: true, role: true, status: true },
            });

            if (!user) {
                res.status(401).json({ success: false, error: 'User not found' });
                return;
            }

            if (user.status !== 'ACTIVE') {
                res.status(403).json({ success: false, error: 'Account is not active' });
                return;
            }

            req.user = {
                userId: user.id,
                email: user.email,
                role: user.role,
            };

            next();
        } catch (jwtError) {
            if ((jwtError as jwt.JsonWebTokenError).name === 'TokenExpiredError') {
                res.status(401).json({ 
                    success: false, 
                    error: 'Session expired. Please log in again.',
                    sessionExpired: true,
                });
                return;
            }
            res.status(401).json({ success: false, error: 'Invalid token' });
            return;
        }
    } catch (error) {
        next(error);
    }
};

/**
 * Create role-based authorization middleware
 */
export const authorize = (...allowedRoles: Role[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ success: false, error: 'Not authenticated' });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: 'You do not have permission to access this resource'
            });
            return;
        }

        next();
    };
};

/**
 * Check if user is the owner of a resource or has admin privileges
 */
export const authorizeOwnerOrAdmin = (
    getResourceOwnerId: (req: Request) => Promise<string | null>
) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: 'Not authenticated' });
                return;
            }

            const adminRoles: Role[] = ['ADMIN', 'SUPERADMIN'];

            // Admins and superadmins can access any resource
            if (adminRoles.includes(req.user.role)) {
                next();
                return;
            }

            // Check if user owns the resource
            const ownerId = await getResourceOwnerId(req);

            if (!ownerId || ownerId !== req.user.userId) {
                res.status(403).json({
                    success: false,
                    error: 'You do not have permission to access this resource'
                });
                return;
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

// Role hierarchy for permission checking
export const ROLE_HIERARCHY: Record<Role, number> = {
    CUSTOMER: 1,
    EXPERT: 2,
    ANALYST: 3,
    ADMIN: 4,
    SUPERADMIN: 5,
};

/**
 * Check if a role has higher or equal privileges
 */
export const hasHigherOrEqualRole = (userRole: Role, requiredRole: Role): boolean => {
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

/**
 * Middleware to ensure only SuperAdmin can manage other SuperAdmins
 */
export const preventSuperAdminModification = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const targetUserId = req.params.id || req.params.userId;

        if (!targetUserId) {
            next();
            return;
        }

        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { role: true },
        });

        if (targetUser?.role === 'SUPERADMIN' && req.user?.role !== 'SUPERADMIN') {
            res.status(403).json({
                success: false,
                error: 'Only SuperAdmin can modify other SuperAdmin accounts'
            });
            return;
        }

        next();
    } catch (error) {
        next(error);
    }
};
