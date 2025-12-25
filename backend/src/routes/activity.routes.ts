import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { handleValidation } from '../middleware/handleValidation';
import { paginationValidator } from '../middleware/validators';

const router = Router();

router.use(authenticate);

// Get activity logs for current user
router.get('/my-activity', paginationValidator, handleValidation, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const { page = 1, limit = 20 } = req.query;

        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const skip = (pageNum - 1) * limitNum;

        const [logs, total] = await Promise.all([
            prisma.activityLog.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNum,
            }),
            prisma.activityLog.count({ where: { userId } }),
        ]);

        res.json({
            success: true,
            data: {
                logs,
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
});

// Get login history for current user
router.get('/login-history', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const { limit = 10 } = req.query;

        const history = await prisma.loginHistory.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit as string, 10),
        });

        res.json({
            success: true,
            data: { history },
        });
    } catch (error) {
        next(error);
    }
});

// Get all activity logs (Admin/SuperAdmin)
router.get(
    '/',
    authorize('ADMIN', 'SUPERADMIN'),
    paginationValidator,
    handleValidation,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { page = 1, limit = 50, userId, action, entityType, startDate, endDate } = req.query;

            const pageNum = parseInt(page as string, 10);
            const limitNum = parseInt(limit as string, 10);
            const skip = (pageNum - 1) * limitNum;

            const where: any = {};
            if (userId) where.userId = userId as string;
            if (action) where.action = action as string;
            if (entityType) where.entityType = entityType as string;
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) where.createdAt.gte = new Date(startDate as string);
                if (endDate) where.createdAt.lte = new Date(endDate as string);
            }

            const [logs, total] = await Promise.all([
                prisma.activityLog.findMany({
                    where,
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, role: true },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limitNum,
                }),
                prisma.activityLog.count({ where }),
            ]);

            res.json({
                success: true,
                data: {
                    logs,
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
    }
);

// Get all login history (SuperAdmin)
router.get(
    '/all-logins',
    authorize('SUPERADMIN'),
    paginationValidator,
    handleValidation,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { page = 1, limit = 50, userId, success } = req.query;

            const pageNum = parseInt(page as string, 10);
            const limitNum = parseInt(limit as string, 10);
            const skip = (pageNum - 1) * limitNum;

            const where: any = {};
            if (userId) where.userId = userId as string;
            if (success !== undefined) where.success = success === 'true';

            const [history, total] = await Promise.all([
                prisma.loginHistory.findMany({
                    where,
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, role: true },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limitNum,
                }),
                prisma.loginHistory.count({ where }),
            ]);

            res.json({
                success: true,
                data: {
                    history,
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
    }
);

export default router;
