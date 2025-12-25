import { prisma } from '../lib/prisma';
import { Request } from 'express';

interface ActivityLogData {
    userId: string;
    action: string;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, any>;
    req?: Request;
}

/**
 * Log user activity
 */
export const logActivity = async ({
    userId,
    action,
    entityType,
    entityId,
    metadata,
    req,
}: ActivityLogData): Promise<void> => {
    try {
        await prisma.activityLog.create({
            data: {
                userId,
                action,
                entityType,
                entityId,
                metadata: metadata || {},
                ipAddress: req?.ip || req?.headers['x-forwarded-for']?.toString(),
                userAgent: req?.headers['user-agent'],
            },
        });
    } catch (error) {
        console.error('Failed to log activity:', error);
        // Don't throw - logging should not break the main flow
    }
};

/**
 * Log login attempt
 */
export const logLoginAttempt = async (
    userId: string,
    success: boolean,
    req: Request
): Promise<void> => {
    try {
        const userAgent = req.headers['user-agent'] || '';
        const device = parseDevice(userAgent);

        await prisma.loginHistory.create({
            data: {
                userId,
                success,
                ipAddress: req.ip || req.headers['x-forwarded-for']?.toString(),
                userAgent,
                device,
            },
        });

        // If successful, update last login
        if (success) {
            await prisma.user.update({
                where: { id: userId },
                data: { lastLoginAt: new Date() },
            });
        }
    } catch (error) {
        console.error('Failed to log login attempt:', error);
    }
};

/**
 * Parse device type from user agent
 */
const parseDevice = (userAgent: string): string => {
    const ua = userAgent.toLowerCase();

    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
        return 'Mobile';
    }
    if (ua.includes('tablet') || ua.includes('ipad')) {
        return 'Tablet';
    }
    return 'Desktop';
};

/**
 * Get recent activity for a user
 */
export const getRecentActivity = async (
    userId: string,
    limit: number = 10
) => {
    return prisma.activityLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
    });
};

/**
 * Get login history for a user
 */
export const getLoginHistory = async (
    userId: string,
    limit: number = 10
) => {
    return prisma.loginHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
    });
};

// Common action types for consistency
export const ACTIONS = {
    // Auth
    USER_SIGNUP: 'USER_SIGNUP',
    USER_LOGIN: 'USER_LOGIN',
    USER_LOGOUT: 'USER_LOGOUT',
    PASSWORD_CHANGED: 'PASSWORD_CHANGED',
    PASSWORD_RESET: 'PASSWORD_RESET',
    EMAIL_VERIFIED: 'EMAIL_VERIFIED',

    // Profile
    PROFILE_UPDATED: 'PROFILE_UPDATED',
    AVATAR_UPLOADED: 'AVATAR_UPLOADED',

    // Expert Application
    APPLICATION_SUBMITTED: 'APPLICATION_SUBMITTED',
    APPLICATION_UPDATED: 'APPLICATION_UPDATED',
    APPLICATION_APPROVED: 'APPLICATION_APPROVED',
    APPLICATION_REJECTED: 'APPLICATION_REJECTED',

    // Documents
    DOCUMENT_UPLOADED: 'DOCUMENT_UPLOADED',
    DOCUMENT_DELETED: 'DOCUMENT_DELETED',
    DOCUMENT_VERIFIED: 'DOCUMENT_VERIFIED',

    // Tasks
    TASK_CREATED: 'TASK_CREATED',
    TASK_ASSIGNED: 'TASK_ASSIGNED',
    TASK_SUBMITTED: 'TASK_SUBMITTED',
    TASK_COMPLETED: 'TASK_COMPLETED',

    // Tickets
    TICKET_CREATED: 'TICKET_CREATED',
    TICKET_REPLIED: 'TICKET_REPLIED',
    TICKET_RESOLVED: 'TICKET_RESOLVED',

    // Admin actions
    USER_SUSPENDED: 'USER_SUSPENDED',
    USER_ACTIVATED: 'USER_ACTIVATED',
    ROLE_CHANGED: 'ROLE_CHANGED',
    CONFIG_UPDATED: 'CONFIG_UPDATED',
} as const;
