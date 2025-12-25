import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { markNotificationAsRead, markAllNotificationsAsRead, getUnreadCount } from '../utils/notifications';

/**
 * Get user's notifications
 */
export const getNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const { page = 1, limit = 20, unreadOnly } = req.query;

        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const skip = (pageNum - 1) * limitNum;

        const where: any = { userId };
        if (unreadOnly === 'true') {
            where.isRead = false;
        }

        const [notifications, total, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNum,
            }),
            prisma.notification.count({ where }),
            getUnreadCount(userId),
        ]);

        res.json({
            success: true,
            data: {
                notifications,
                unreadCount,
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
 * Mark notification as read
 */
export const markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user!.userId;

        const success = await markNotificationAsRead(id, userId);

        if (!success) {
            res.status(404).json({
                success: false,
                error: 'Notification not found',
            });
            return;
        }

        res.json({
            success: true,
            message: 'Notification marked as read',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user!.userId;

        const count = await markAllNotificationsAsRead(userId);

        res.json({
            success: true,
            message: `${count} notifications marked as read`,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete notification
 */
export const deleteNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user!.userId;

        await prisma.notification.deleteMany({
            where: { id, userId },
        });

        res.json({
            success: true,
            message: 'Notification deleted',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get unread count
 */
export const getCount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const count = await getUnreadCount(userId);

        res.json({
            success: true,
            data: { unreadCount: count },
        });
    } catch (error) {
        next(error);
    }
};
