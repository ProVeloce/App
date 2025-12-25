import { prisma } from '../lib/prisma';
import { NotificationType } from '@prisma/client';

interface CreateNotificationData {
    userId: string;
    type?: NotificationType;
    title: string;
    message: string;
    link?: string;
}

/**
 * Create a notification for a user
 */
export const createNotification = async ({
    userId,
    type = 'INFO',
    title,
    message,
    link,
}: CreateNotificationData): Promise<void> => {
    try {
        await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                link,
            },
        });
    } catch (error) {
        console.error('Failed to create notification:', error);
    }
};

/**
 * Create notifications for multiple users
 */
export const createBulkNotifications = async (
    userIds: string[],
    data: Omit<CreateNotificationData, 'userId'>
): Promise<void> => {
    try {
        await prisma.notification.createMany({
            data: userIds.map(userId => ({
                userId,
                ...data,
                type: data.type || 'INFO',
            })),
        });
    } catch (error) {
        console.error('Failed to create bulk notifications:', error);
    }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (
    notificationId: string,
    userId: string
): Promise<boolean> => {
    const result = await prisma.notification.updateMany({
        where: { id: notificationId, userId },
        data: { isRead: true, readAt: new Date() },
    });
    return result.count > 0;
};

/**
 * Mark all notifications as read for a user
 */
export const markAllNotificationsAsRead = async (userId: string): Promise<number> => {
    const result = await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true, readAt: new Date() },
    });
    return result.count;
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (userId: string): Promise<number> => {
    return prisma.notification.count({
        where: { userId, isRead: false },
    });
};

/**
 * Delete old notifications (retention: 30 days for read, 90 days for unread)
 */
export const cleanupOldNotifications = async (): Promise<number> => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const result = await prisma.notification.deleteMany({
        where: {
            OR: [
                { isRead: true, createdAt: { lt: thirtyDaysAgo } },
                { isRead: false, createdAt: { lt: ninetyDaysAgo } },
            ],
        },
    });
    return result.count;
};

// Notification templates
export const NOTIFICATION_TEMPLATES = {
    welcomeUser: (name: string) => ({
        type: 'SUCCESS' as NotificationType,
        title: 'Welcome to ProVeloce!',
        message: `Hi ${name}, welcome aboard! Complete your profile to get started.`,
        link: '/profile',
    }),

    applicationSubmitted: () => ({
        type: 'INFO' as NotificationType,
        title: 'Application Submitted',
        message: 'Your expert application has been submitted for review.',
        link: '/customer/application-status',
    }),

    applicationApproved: () => ({
        type: 'SUCCESS' as NotificationType,
        title: 'Application Approved! 🎉',
        message: 'Congratulations! You are now a verified expert.',
        link: '/expert/dashboard',
    }),

    applicationRejected: () => ({
        type: 'WARNING' as NotificationType,
        title: 'Application Review Update',
        message: 'Your application needs some updates. Please check the feedback.',
        link: '/customer/application-status',
    }),

    taskAssigned: (taskTitle: string) => ({
        type: 'INFO' as NotificationType,
        title: 'New Task Assigned',
        message: `You have been assigned a new task: ${taskTitle}`,
        link: '/expert/tasks',
    }),

    ticketReply: () => ({
        type: 'INFO' as NotificationType,
        title: 'Ticket Update',
        message: 'There is a new reply on your support ticket.',
        link: '/help-desk',
    }),

    ticketResolved: () => ({
        type: 'SUCCESS' as NotificationType,
        title: 'Ticket Resolved',
        message: 'Your support ticket has been resolved.',
        link: '/help-desk',
    }),
};
