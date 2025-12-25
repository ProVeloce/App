import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { logActivity, ACTIONS } from '../utils/activity';
import { createBulkNotifications } from '../utils/notifications';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN', 'SUPERADMIN'));

// Get admin dashboard stats
router.get('/dashboard', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [
            totalUsers,
            newUsersThisMonth,
            totalExperts,
            pendingApplications,
            tasksCompleted,
            openTickets,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
            prisma.user.count({ where: { role: 'EXPERT' } }),
            prisma.expertApplication.count({ where: { status: 'PENDING' } }),
            prisma.task.count({ where: { status: 'COMPLETED', updatedAt: { gte: thirtyDaysAgo } } }),
            prisma.ticket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
        ]);

        // Get recent users for growth data (simplified for MongoDB)
        const recentUsers = await prisma.user.findMany({
            where: { createdAt: { gte: thirtyDaysAgo } },
            select: { createdAt: true },
            orderBy: { createdAt: 'asc' },
        });

        // Group by date in JavaScript
        const userGrowthMap = new Map<string, number>();
        recentUsers.forEach(user => {
            const date = user.createdAt.toISOString().split('T')[0];
            userGrowthMap.set(date, (userGrowthMap.get(date) || 0) + 1);
        });
        const userGrowth = Array.from(userGrowthMap.entries()).map(([date, count]) => ({ date, count }));

        res.json({
            success: true,
            data: {
                stats: {
                    totalUsers,
                    newUsersThisMonth,
                    totalExperts,
                    pendingApplications,
                    tasksCompleted,
                    openTickets,
                },
                userGrowth,
            },
        });
    } catch (error) {
        next(error);
    }
});

// Get reports
router.get('/reports', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { startDate, endDate, type } = req.query;

        const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate as string) : new Date();

        let data: any = {};

        if (!type || type === 'users') {
            data.usersByRole = await prisma.user.groupBy({
                by: ['role'],
                _count: true,
                where: { createdAt: { gte: start, lte: end } },
            });
        }

        if (!type || type === 'applications') {
            data.applicationsByStatus = await prisma.expertApplication.groupBy({
                by: ['status'],
                _count: true,
                where: { createdAt: { gte: start, lte: end } },
            });
        }

        if (!type || type === 'tasks') {
            data.tasksByStatus = await prisma.task.groupBy({
                by: ['status'],
                _count: true,
                where: { createdAt: { gte: start, lte: end } },
            });
        }

        if (!type || type === 'tickets') {
            data.ticketsByStatus = await prisma.ticket.groupBy({
                by: ['status'],
                _count: true,
                where: { createdAt: { gte: start, lte: end } },
            });
        }

        res.json({
            success: true,
            data,
        });
    } catch (error) {
        next(error);
    }
});

// Create announcement
router.post('/announcements', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { title, content, targetRoles, startsAt, endsAt } = req.body;
        const createdBy = req.user!.userId;

        const announcement = await prisma.announcement.create({
            data: {
                title,
                content,
                targetRoles: targetRoles || [Role.CUSTOMER, Role.EXPERT, Role.ANALYST, Role.ADMIN],
                startsAt: startsAt ? new Date(startsAt) : undefined,
                endsAt: endsAt ? new Date(endsAt) : undefined,
                createdBy,
            },
        });

        // Get users with target roles
        const targetUsers = await prisma.user.findMany({
            where: { role: { in: announcement.targetRoles } },
            select: { id: true },
        });

        // Create notifications
        await createBulkNotifications(
            targetUsers.map(u => u.id),
            {
                type: 'INFO',
                title: `📢 ${title}`,
                message: content.substring(0, 100) + '...',
                link: '/announcements',
            }
        );

        res.status(201).json({
            success: true,
            message: 'Announcement created',
            data: { announcement },
        });
    } catch (error) {
        next(error);
    }
});

// Get announcements
router.get('/announcements', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const announcements = await prisma.announcement.findMany({
            orderBy: { createdAt: 'desc' },
        });

        res.json({
            success: true,
            data: { announcements },
        });
    } catch (error) {
        next(error);
    }
});

// Delete announcement
router.delete('/announcements/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        await prisma.announcement.delete({
            where: { id },
        });

        res.json({
            success: true,
            message: 'Announcement deleted',
        });
    } catch (error) {
        next(error);
    }
});

export default router;
