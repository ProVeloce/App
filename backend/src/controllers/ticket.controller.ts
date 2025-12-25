import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { logActivity, ACTIONS } from '../utils/activity';
import { createNotification, NOTIFICATION_TEMPLATES } from '../utils/notifications';
import { TicketStatus } from '@prisma/client';

/**
 * Create a new ticket
 */
export const createTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { category, priority, subject, description } = req.body;
        const userId = req.user!.userId;

        // Get file URLs from uploaded files
        const attachments = req.files
            ? (req.files as Express.Multer.File[]).map(f => `/uploads/tickets/${f.filename}`)
            : [];

        const ticket = await prisma.ticket.create({
            data: {
                userId,
                category,
                priority: priority || 'MEDIUM',
                subject,
                description,
                attachments,
            },
        });

        await logActivity({
            userId,
            action: ACTIONS.TICKET_CREATED,
            entityType: 'Ticket',
            entityId: ticket.id,
            req,
        });

        res.status(201).json({
            success: true,
            message: 'Ticket created successfully',
            data: { ticket },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get user's tickets
 */
export const getMyTickets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const { status, page = 1, limit = 20 } = req.query;

        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const skip = (pageNum - 1) * limitNum;

        const where: any = { userId };
        if (status) {
            where.status = status as TicketStatus;
        }

        const [tickets, total] = await Promise.all([
            prisma.ticket.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNum,
            }),
            prisma.ticket.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                tickets,
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
 * Get all tickets (Admin/Analyst)
 */
export const getAllTickets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const {
            status,
            category,
            priority,
            assignedToId,
            page = 1,
            limit = 20,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = req.query;

        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const skip = (pageNum - 1) * limitNum;

        const where: any = {};
        if (status) where.status = status;
        if (category) where.category = category;
        if (priority) where.priority = priority;
        if (assignedToId) where.assignedToId = assignedToId as string;

        const [tickets, total] = await Promise.all([
            prisma.ticket.findMany({
                where,
                include: {
                    user: {
                        select: { id: true, name: true, email: true },
                    },
                    assignedTo: {
                        select: { id: true, name: true },
                    },
                },
                orderBy: { [sortBy as string]: sortOrder },
                skip,
                take: limitNum,
            }),
            prisma.ticket.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                tickets,
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
 * Get ticket by ID
 */
export const getTicketById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user!.userId;
        const userRole = req.user!.role;

        const ticket = await prisma.ticket.findUnique({
            where: { id },
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
                assignedTo: {
                    select: { id: true, name: true },
                },
                messages: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        if (!ticket) {
            throw new AppError('Ticket not found', 404);
        }

        // Users can only view their own tickets
        const adminRoles = ['ANALYST', 'ADMIN', 'SUPERADMIN'];
        if (!adminRoles.includes(userRole) && ticket.userId !== userId) {
            throw new AppError('Access denied', 403);
        }

        res.json({
            success: true,
            data: { ticket },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Add message to ticket
 */
export const addMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.user!.userId;

        const ticket = await prisma.ticket.findUnique({
            where: { id },
        });

        if (!ticket) {
            throw new AppError('Ticket not found', 404);
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, role: true },
        });

        // Get attachments
        const attachments = req.files
            ? (req.files as Express.Multer.File[]).map(f => `/uploads/tickets/${f.filename}`)
            : [];

        const message = await prisma.ticketMessage.create({
            data: {
                ticketId: id,
                senderId: userId,
                senderName: user!.name,
                senderRole: user!.role,
                content,
                attachments,
            },
        });

        // Update ticket status if staff replies
        const staffRoles = ['ANALYST', 'ADMIN', 'SUPERADMIN'];
        if (staffRoles.includes(user!.role) && ticket.status === 'OPEN') {
            await prisma.ticket.update({
                where: { id },
                data: { status: 'IN_PROGRESS' },
            });
        }

        // Notify the other party
        const notifyUserId = staffRoles.includes(user!.role) ? ticket.userId : ticket.assignedToId;
        if (notifyUserId) {
            await createNotification({
                userId: notifyUserId,
                ...NOTIFICATION_TEMPLATES.ticketReply(),
            });
        }

        await logActivity({
            userId,
            action: ACTIONS.TICKET_REPLIED,
            entityType: 'Ticket',
            entityId: id,
            req,
        });

        res.status(201).json({
            success: true,
            data: { message },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Assign ticket to staff
 */
export const assignTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { assignedToId } = req.body;

        const ticket = await prisma.ticket.update({
            where: { id },
            data: {
                assignedToId,
                status: 'IN_PROGRESS',
            },
        });

        res.json({
            success: true,
            message: 'Ticket assigned successfully',
            data: { ticket },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update ticket status
 */
export const updateTicketStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const ticket = await prisma.ticket.update({
            where: { id },
            data: {
                status,
                ...(status === 'RESOLVED' && { resolvedAt: new Date() }),
            },
        });

        // Notify user if resolved
        if (status === 'RESOLVED') {
            await createNotification({
                userId: ticket.userId,
                ...NOTIFICATION_TEMPLATES.ticketResolved(),
            });

            await logActivity({
                userId: req.user!.userId,
                action: ACTIONS.TICKET_RESOLVED,
                entityType: 'Ticket',
                entityId: id,
                req,
            });
        }

        res.json({
            success: true,
            message: 'Ticket status updated',
            data: { ticket },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get ticket statistics
 */
export const getTicketStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const [total, byStatus, byPriority, byCategory] = await Promise.all([
            prisma.ticket.count(),
            prisma.ticket.groupBy({
                by: ['status'],
                _count: true,
            }),
            prisma.ticket.groupBy({
                by: ['priority'],
                _count: true,
            }),
            prisma.ticket.groupBy({
                by: ['category'],
                _count: true,
            }),
        ]);

        res.json({
            success: true,
            data: {
                total,
                byStatus: byStatus.reduce((acc, item) => ({ ...acc, [item.status]: item._count }), {}),
                byPriority: byPriority.reduce((acc, item) => ({ ...acc, [item.priority]: item._count }), {}),
                byCategory: byCategory.reduce((acc, item) => ({ ...acc, [item.category]: item._count }), {}),
            },
        });
    } catch (error) {
        next(error);
    }
};
