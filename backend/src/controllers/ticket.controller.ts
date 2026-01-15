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
        const userRole = req.user!.role;
        const { status, page = 1, limit = 20 } = req.query;

        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const skip = (pageNum - 1) * limitNum;

        // Build where clause based on role
        let where: any = {};
        
        if (userRole === 'SUPERADMIN') {
            // Superadmin sees all tickets
            if (status) where.status = status as TicketStatus;
        } else if (userRole === 'ADMIN') {
            // Admin sees tickets assigned to them OR raised by them
            where = {
                OR: [
                    { assignedToId: userId },
                    { userId: userId }
                ]
            };
            if (status) where.status = status as TicketStatus;
        } else {
            // Regular users see only their own tickets
            where = { userId };
            if (status) where.status = status as TicketStatus;
        }

        const [tickets, total] = await Promise.all([
            prisma.ticket.findMany({
                where,
                include: {
                    user: {
                        select: { id: true, name: true, email: true, role: true },
                    },
                    assignedTo: {
                        select: { id: true, name: true, role: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNum,
            }),
            prisma.ticket.count({ where }),
        ]);

        // Transform tickets to include user info
        const transformedTickets = tickets.map(t => ({
            id: t.id,
            ticket_id: t.id,
            raised_by_user_id: t.userId,
            user_full_name: t.user?.name || 'Unknown',
            user_email: t.user?.email || '',
            user_role: t.user?.role || 'CUSTOMER',
            subject: t.subject,
            category: t.category,
            description: t.description,
            attachments: t.attachments,
            status: t.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            assigned_user_id: t.assignedToId,
            assigned_user_name: t.assignedTo?.name || null,
            assigned_user_role: t.assignedTo?.role || null,
            created_at: t.createdAt.toISOString(),
            updated_at: t.updatedAt.toISOString(),
            priority: t.priority?.toLowerCase(),
        }));

        res.json({
            success: true,
            data: {
                tickets: transformedTickets,
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
                        select: { id: true, name: true, email: true, role: true },
                    },
                    assignedTo: {
                        select: { id: true, name: true, role: true },
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
                    select: { id: true, name: true, email: true, phone: true, role: true },
                },
                assignedTo: {
                    select: { id: true, name: true, role: true },
                },
                messages: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        sender: {
                            select: { id: true, name: true, role: true },
                        },
                    },
                },
            },
        });

        if (!ticket) {
            throw new AppError('Ticket not found', 404);
        }

        // Access control: Users can only view their own tickets, admins can view assigned tickets
        const adminRoles = ['ANALYST', 'ADMIN', 'SUPERADMIN'];
        const canAccess = adminRoles.includes(userRole) || 
                          ticket.userId === userId || 
                          ticket.assignedToId === userId;
        
        if (!canAccess) {
            throw new AppError('Access denied', 403);
        }

        // Transform ticket for frontend
        const transformedTicket = {
            id: ticket.id,
            ticket_id: ticket.id,
            raised_by_user_id: ticket.userId,
            user_full_name: ticket.user?.name || 'Unknown',
            user_email: ticket.user?.email || '',
            user_role: ticket.user?.role || 'CUSTOMER',
            user_phone_number: ticket.user?.phone || null,
            subject: ticket.subject,
            category: ticket.category,
            description: ticket.description,
            attachments: ticket.attachments?.map((url, idx) => ({
                id: `att-${idx}`,
                filename: url.split('/').pop() || 'attachment',
                filetype: 'application/octet-stream',
                url: url,
            })),
            status: ticket.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            assigned_user_id: ticket.assignedToId,
            assigned_user_name: ticket.assignedTo?.name || null,
            assigned_user_role: ticket.assignedTo?.role || null,
            created_at: ticket.createdAt.toISOString(),
            updated_at: ticket.updatedAt.toISOString(),
            priority: ticket.priority?.toLowerCase(),
            resolved_at: ticket.resolvedAt?.toISOString() || null,
        };

        // Transform messages with sender name and role
        const transformedMessages = ticket.messages.map(m => ({
            id: m.id,
            sender_id: m.senderId,
            sender_name: m.senderName,
            sender_role: m.senderRole,
            text: m.content,
            content: m.content,
            timestamp: m.createdAt.toISOString(),
            attachments: m.attachments,
        }));

        res.json({
            success: true,
            data: { 
                ticket: transformedTicket,
                messages: transformedMessages,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Add message to ticket
 * Rules:
 * - Ticket must not be closed
 * - Only ticket raiser OR assigned reviewer can add messages
 * - Superadmin can only respond to Admin-raised tickets
 */
export const addMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.user!.userId;
        const userRole = req.user!.role;

        const ticket = await prisma.ticket.findUnique({
            where: { id },
            include: {
                user: {
                    select: { id: true, role: true },
                },
            },
        });

        if (!ticket) {
            throw new AppError('Ticket not found', 404);
        }

        // Rule 5: Ticket must not be closed
        if (ticket.status === 'CLOSED') {
            throw new AppError('Cannot add messages to a closed ticket', 400);
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, role: true },
        });

        const isTicketRaiser = ticket.userId === userId;
        const isAssignedReviewer = ticket.assignedToId === userId;
        const ticketRaiserRole = ticket.user?.role;

        // Rule 1 & 2: Superadmin authorization
        if (userRole === 'SUPERADMIN') {
            // Superadmin can only respond to Admin-raised tickets
            if (ticketRaiserRole !== 'ADMIN') {
                throw new AppError('Superadmin can only respond to tickets raised by Admins', 403);
            }
        } else {
            // Rule 4: Only ticket raiser OR assigned reviewer can communicate
            if (!isTicketRaiser && !isAssignedReviewer) {
                throw new AppError('Only the ticket raiser or assigned reviewer can add messages', 403);
            }
        }

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

        // Update ticket status if staff replies and ticket is OPEN
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
            data: { 
                message: {
                    id: message.id,
                    sender_id: message.senderId,
                    sender_name: message.senderName,
                    sender_role: message.senderRole,
                    text: message.content,
                    timestamp: message.createdAt.toISOString(),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Assign ticket to staff
 * Rules:
 * - Superadmin can only assign Expert/Customer tickets to Admins
 * - Cannot assign Admin-raised tickets (Superadmin responds directly)
 */
export const assignTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { assignedToId } = req.body;
        const userRole = req.user!.role;

        const ticket = await prisma.ticket.findUnique({
            where: { id },
            include: {
                user: {
                    select: { id: true, role: true },
                },
            },
        });

        if (!ticket) {
            throw new AppError('Ticket not found', 404);
        }

        const ticketRaiserRole = ticket.user?.role;

        // Rule 1: Superadmin can only assign Expert/Customer tickets
        if (userRole === 'SUPERADMIN') {
            if (ticketRaiserRole === 'ADMIN') {
                throw new AppError('Cannot assign Admin-raised tickets. Superadmin should respond directly.', 400);
            }
        }

        // Verify assignee is an Admin
        const assignee = await prisma.user.findUnique({
            where: { id: assignedToId },
            select: { id: true, role: true, status: true },
        });

        if (!assignee) {
            throw new AppError('Assignee not found', 404);
        }

        if (assignee.role !== 'ADMIN') {
            throw new AppError('Tickets can only be assigned to Admins', 400);
        }

        if (assignee.status !== 'ACTIVE') {
            throw new AppError('Cannot assign to inactive user', 400);
        }

        const updatedTicket = await prisma.ticket.update({
            where: { id },
            data: {
                assignedToId,
                status: ticket.status === 'OPEN' ? 'IN_PROGRESS' : ticket.status,
            },
            include: {
                assignedTo: {
                    select: { id: true, name: true, role: true },
                },
            },
        });

        // Notify the assigned admin
        await createNotification({
            userId: assignedToId,
            title: 'Ticket Assigned',
            message: `A new ticket has been assigned to you: ${ticket.subject}`,
            type: 'INFO',
        });

        await logActivity({
            userId: req.user!.userId,
            action: 'TICKET_ASSIGNED',
            entityType: 'Ticket',
            entityId: id,
            req,
        });

        res.json({
            success: true,
            message: 'Ticket assigned successfully',
            data: { 
                ticket: {
                    ...updatedTicket,
                    assigned_user_id: updatedTicket.assignedToId,
                    assigned_user_name: updatedTicket.assignedTo?.name,
                    assigned_user_role: updatedTicket.assignedTo?.role,
                },
            },
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
        const { status, message } = req.body;
        const userId = req.user!.userId;
        const userRole = req.user!.role;

        const ticket = await prisma.ticket.findUnique({
            where: { id },
            include: {
                user: {
                    select: { id: true, role: true },
                },
            },
        });

        if (!ticket) {
            throw new AppError('Ticket not found', 404);
        }

        // Cannot update closed tickets
        if (ticket.status === 'CLOSED') {
            throw new AppError('Cannot update a closed ticket', 400);
        }

        const isAssignedReviewer = ticket.assignedToId === userId;
        const ticketRaiserRole = ticket.user?.role;

        // Authorization check for status updates
        if (userRole === 'SUPERADMIN') {
            // Superadmin can only update status on Admin-raised tickets
            if (ticketRaiserRole !== 'ADMIN') {
                throw new AppError('Superadmin can only update status on tickets raised by Admins', 403);
            }
        } else if (userRole === 'ADMIN') {
            // Admin can only update status if they are the assigned reviewer
            if (!isAssignedReviewer) {
                throw new AppError('Only the assigned reviewer can update ticket status', 403);
            }
        }

        // Add status change message if provided
        if (message && message.trim()) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { name: true, role: true },
            });

            await prisma.ticketMessage.create({
                data: {
                    ticketId: id,
                    senderId: userId,
                    senderName: user!.name,
                    senderRole: user!.role,
                    content: message.trim(),
                    attachments: [],
                },
            });
        }

        const updatedTicket = await prisma.ticket.update({
            where: { id },
            data: {
                status,
                ...(status === 'RESOLVED' && { resolvedAt: new Date() }),
            },
        });

        // Notify user if resolved or closed
        if (status === 'RESOLVED' || status === 'CLOSED') {
            await createNotification({
                userId: ticket.userId,
                ...NOTIFICATION_TEMPLATES.ticketResolved(),
            });

            await logActivity({
                userId,
                action: status === 'RESOLVED' ? ACTIONS.TICKET_RESOLVED : 'TICKET_CLOSED',
                entityType: 'Ticket',
                entityId: id,
                req,
            });
        }

        res.json({
            success: true,
            message: 'Ticket status updated',
            data: { ticket: updatedTicket },
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
