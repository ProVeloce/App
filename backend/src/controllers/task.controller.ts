import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { logActivity, ACTIONS } from '../utils/activity';
import { createNotification, NOTIFICATION_TEMPLATES } from '../utils/notifications';
import { TaskStatus } from '@prisma/client';

/**
 * Create a new task (Admin)
 */
export const createTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { title, description, deadline, assignedToId, priority } = req.body;
        const createdById = req.user!.userId;

        // Verify assignee exists and is an expert
        const assignee = await prisma.user.findUnique({
            where: { id: assignedToId },
            select: { id: true, role: true, name: true },
        });

        if (!assignee) {
            throw new AppError('Assignee not found', 404);
        }

        if (assignee.role !== 'EXPERT') {
            throw new AppError('Tasks can only be assigned to experts', 400);
        }

        const task = await prisma.task.create({
            data: {
                title,
                description,
                deadline: deadline ? new Date(deadline) : undefined,
                assignedToId,
                createdById,
                priority: priority || 'MEDIUM',
            },
            include: {
                assignedTo: {
                    select: { id: true, name: true, email: true },
                },
            },
        });

        await logActivity({
            userId: createdById,
            action: ACTIONS.TASK_CREATED,
            entityType: 'Task',
            entityId: task.id,
            metadata: { assignedTo: assignedToId },
            req,
        });

        await createNotification({
            userId: assignedToId,
            ...NOTIFICATION_TEMPLATES.taskAssigned(title),
        });

        res.status(201).json({
            success: true,
            message: 'Task created successfully',
            data: { task },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get tasks (filterable)
 */
export const getTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            assignedToId,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = req.query;

        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const skip = (pageNum - 1) * limitNum;

        const where: any = {};

        // Experts only see their own tasks
        if (req.user?.role === 'EXPERT') {
            where.assignedToId = req.user.userId;
        } else if (assignedToId) {
            where.assignedToId = assignedToId as string;
        }

        if (status) {
            where.status = status as TaskStatus;
        }

        const [tasks, total] = await Promise.all([
            prisma.task.findMany({
                where,
                include: {
                    assignedTo: {
                        select: { id: true, name: true, email: true },
                    },
                    createdBy: {
                        select: { id: true, name: true },
                    },
                    _count: {
                        select: { submissions: true },
                    },
                },
                orderBy: { [sortBy as string]: sortOrder },
                skip,
                take: limitNum,
            }),
            prisma.task.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                tasks,
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
 * Get task by ID
 */
export const getTaskById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;

        const task = await prisma.task.findUnique({
            where: { id },
            include: {
                assignedTo: {
                    select: { id: true, name: true, email: true },
                },
                createdBy: {
                    select: { id: true, name: true },
                },
                submissions: {
                    include: {
                        expert: {
                            select: { id: true, name: true },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
                comments: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!task) {
            throw new AppError('Task not found', 404);
        }

        // Experts can only view their own tasks
        if (req.user?.role === 'EXPERT' && task.assignedToId !== req.user.userId) {
            throw new AppError('Access denied', 403);
        }

        res.json({
            success: true,
            data: { task },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update task
 */
export const updateTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { title, description, deadline, priority, status } = req.body;

        const task = await prisma.task.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(description !== undefined && { description }),
                ...(deadline && { deadline: new Date(deadline) }),
                ...(priority && { priority }),
                ...(status && { status }),
            },
        });

        res.json({
            success: true,
            message: 'Task updated successfully',
            data: { task },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Submit work for a task (Expert)
 */
export const submitWork = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { message } = req.body;
        const expertId = req.user!.userId;

        const task = await prisma.task.findUnique({
            where: { id },
        });

        if (!task) {
            throw new AppError('Task not found', 404);
        }

        if (task.assignedToId !== expertId) {
            throw new AppError('You are not assigned to this task', 403);
        }

        // Get file URLs from uploaded files
        const fileUrls = req.files
            ? (req.files as Express.Multer.File[]).map(f => `/uploads/submissions/${f.filename}`)
            : [];

        const submission = await prisma.taskSubmission.create({
            data: {
                taskId: id,
                expertId,
                message,
                fileUrls,
            },
        });

        // Update task status
        await prisma.task.update({
            where: { id },
            data: { status: 'SUBMITTED' },
        });

        await logActivity({
            userId: expertId,
            action: ACTIONS.TASK_SUBMITTED,
            entityType: 'Task',
            entityId: id,
            req,
        });

        res.status(201).json({
            success: true,
            message: 'Work submitted successfully',
            data: { submission },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Add comment to task
 */
export const addTaskComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.user!.userId;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true },
        });

        const comment = await prisma.taskComment.create({
            data: {
                taskId: id,
                authorId: userId,
                authorName: user!.name,
                content,
            },
        });

        res.status(201).json({
            success: true,
            data: { comment },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Complete task (Admin marks as complete)
 */
export const completeTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;

        const task = await prisma.task.update({
            where: { id },
            data: { status: 'COMPLETED' },
        });

        await logActivity({
            userId: req.user!.userId,
            action: ACTIONS.TASK_COMPLETED,
            entityType: 'Task',
            entityId: id,
            req,
        });

        res.json({
            success: true,
            message: 'Task marked as complete',
            data: { task },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get expert's task statistics
 */
export const getMyTaskStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const expertId = req.user!.userId;

        const [total, byStatus, todaysTasks] = await Promise.all([
            prisma.task.count({ where: { assignedToId: expertId } }),
            prisma.task.groupBy({
                by: ['status'],
                where: { assignedToId: expertId },
                _count: true,
            }),
            prisma.task.count({
                where: {
                    assignedToId: expertId,
                    createdAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    },
                },
            }),
        ]);

        res.json({
            success: true,
            data: {
                total,
                byStatus: byStatus.reduce((acc, item) => ({ ...acc, [item.status]: item._count }), {}),
                todaysTasks,
            },
        });
    } catch (error) {
        next(error);
    }
};
