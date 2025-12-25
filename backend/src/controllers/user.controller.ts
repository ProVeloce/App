import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { logActivity, ACTIONS } from '../utils/activity';
import { Role, UserStatus } from '@prisma/client';

/**
 * Get all users with pagination and filters
 */
export const getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const {
            page = 1,
            limit = 20,
            role,
            status,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = req.query;

        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const skip = (pageNum - 1) * limitNum;

        // Build where clause
        const where: any = {};

        if (role) {
            where.role = role as Role;
        }

        if (status) {
            where.status = status as UserStatus;
        }

        if (search) {
            where.OR = [
                { name: { contains: search as string, mode: 'insensitive' } },
                { email: { contains: search as string, mode: 'insensitive' } },
                { phone: { contains: search as string } },
            ];
        }

        // Hide superadmin from non-superadmin users
        if (req.user?.role !== 'SUPERADMIN') {
            where.role = { not: 'SUPERADMIN' };
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    role: true,
                    status: true,
                    emailVerified: true,
                    lastLoginAt: true,
                    createdAt: true,
                },
                orderBy: { [sortBy as string]: sortOrder },
                skip,
                take: limitNum,
            }),
            prisma.user.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get user by ID
 */
export const getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                emailVerified: true,
                lastLoginAt: true,
                createdAt: true,
                updatedAt: true,
                profile: true,
            },
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Prevent accessing superadmin details by non-superadmins
        if (user.role === 'SUPERADMIN' && req.user?.role !== 'SUPERADMIN') {
            throw new AppError('Access denied', 403);
        }

        res.json({
            success: true,
            data: { user },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update user role
 */
export const updateUserRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const user = await prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Only superadmin can create/modify superadmins
        if (role === 'SUPERADMIN' && req.user?.role !== 'SUPERADMIN') {
            throw new AppError('Only SuperAdmin can assign SuperAdmin role', 403);
        }

        // Cannot demote superadmin unless you're superadmin
        if (user.role === 'SUPERADMIN' && req.user?.role !== 'SUPERADMIN') {
            throw new AppError('Cannot modify SuperAdmin accounts', 403);
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { role, updatedBy: req.user!.userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            },
        });

        await logActivity({
            userId: req.user!.userId,
            action: ACTIONS.ROLE_CHANGED,
            entityType: 'User',
            entityId: id,
            metadata: { oldRole: user.role, newRole: role },
            req,
        });

        res.json({
            success: true,
            message: 'User role updated successfully',
            data: { user: updatedUser },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update user status (suspend/activate)
 */
export const updateUserStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const user = await prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        if (user.role === 'SUPERADMIN' && req.user?.role !== 'SUPERADMIN') {
            throw new AppError('Cannot modify SuperAdmin accounts', 403);
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { status, updatedBy: req.user!.userId },
            select: {
                id: true,
                name: true,
                email: true,
                status: true,
            },
        });

        const action = status === 'SUSPENDED' ? ACTIONS.USER_SUSPENDED : ACTIONS.USER_ACTIVATED;
        await logActivity({
            userId: req.user!.userId,
            action,
            entityType: 'User',
            entityId: id,
            req,
        });

        res.json({
            success: true,
            message: `User ${status === 'SUSPENDED' ? 'suspended' : 'activated'} successfully`,
            data: { user: updatedUser },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete user (soft delete by setting status to DEACTIVATED)
 */
export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        if (user.role === 'SUPERADMIN') {
            throw new AppError('Cannot delete SuperAdmin accounts', 403);
        }

        await prisma.user.update({
            where: { id },
            data: { status: 'DEACTIVATED', updatedBy: req.user!.userId },
        });

        await logActivity({
            userId: req.user!.userId,
            action: 'USER_DELETED',
            entityType: 'User',
            entityId: id,
            req,
        });

        res.json({
            success: true,
            message: 'User deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get user statistics
 */
export const getUserStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const [totalUsers, byRole, byStatus, recentSignups] = await Promise.all([
            prisma.user.count(),
            prisma.user.groupBy({
                by: ['role'],
                _count: true,
            }),
            prisma.user.groupBy({
                by: ['status'],
                _count: true,
            }),
            prisma.user.count({
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    },
                },
            }),
        ]);

        res.json({
            success: true,
            data: {
                totalUsers,
                byRole: byRole.reduce((acc, item) => ({ ...acc, [item.role]: item._count }), {}),
                byStatus: byStatus.reduce((acc, item) => ({ ...acc, [item.status]: item._count }), {}),
                recentSignups,
            },
        });
    } catch (error) {
        next(error);
    }
};
