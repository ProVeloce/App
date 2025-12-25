import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { logActivity, ACTIONS } from '../utils/activity';
import { createNotification, NOTIFICATION_TEMPLATES } from '../utils/notifications';
import { sendApplicationStatusEmail } from '../utils/email';
import { ApplicationStatus } from '@prisma/client';

/**
 * Create or update expert application (customer)
 */
export const submitApplication = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const applicationData = req.body;

        // Check if user already has an approved expert role
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });

        if (user?.role === 'EXPERT') {
            throw new AppError('You are already an expert', 400);
        }

        // Check for existing application
        const existingApplication = await prisma.expertApplication.findUnique({
            where: { userId },
        });

        if (existingApplication && existingApplication.status === 'APPROVED') {
            throw new AppError('Application already approved', 400);
        }

        if (existingApplication && existingApplication.status === 'PENDING') {
            throw new AppError('You already have a pending application', 400);
        }

        // Create or update application
        const application = await prisma.expertApplication.upsert({
            where: { userId },
            create: {
                userId,
                ...applicationData,
                status: 'PENDING',
                submittedAt: new Date(),
            },
            update: {
                ...applicationData,
                status: 'PENDING',
                submittedAt: new Date(),
                rejectionReason: null,
            },
        });

        await logActivity({
            userId,
            action: ACTIONS.APPLICATION_SUBMITTED,
            entityType: 'ExpertApplication',
            entityId: application.id,
            req,
        });

        await createNotification({
            userId,
            ...NOTIFICATION_TEMPLATES.applicationSubmitted(),
        });

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            data: { application },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Save application as draft
 */
export const saveDraft = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const applicationData = req.body;

        const application = await prisma.expertApplication.upsert({
            where: { userId },
            create: {
                userId,
                ...applicationData,
                status: 'DRAFT',
            },
            update: {
                ...applicationData,
                status: 'DRAFT',
            },
        });

        res.json({
            success: true,
            message: 'Draft saved successfully',
            data: { application },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get current user's application
 */
export const getMyApplication = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user!.userId;

        const application = await prisma.expertApplication.findUnique({
            where: { userId },
            include: {
                comments: {
                    where: { isInternal: false },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        res.json({
            success: true,
            data: { application },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all applications (admin/analyst)
 */
export const getApplications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            sortBy = 'submittedAt',
            sortOrder = 'desc',
        } = req.query;

        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const skip = (pageNum - 1) * limitNum;

        const where: any = {};
        if (status) {
            where.status = status as ApplicationStatus;
        }

        const [applications, total] = await Promise.all([
            prisma.expertApplication.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                            createdAt: true,
                        },
                    },
                },
                orderBy: { [sortBy as string]: sortOrder },
                skip,
                take: limitNum,
            }),
            prisma.expertApplication.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                applications,
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
 * Get application by ID (admin/analyst)
 */
export const getApplicationById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;

        const application = await prisma.expertApplication.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        createdAt: true,
                        profile: true,
                    },
                },
                comments: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!application) {
            throw new AppError('Application not found', 404);
        }

        // Get user's documents
        const documents = await prisma.document.findMany({
            where: { userId: application.userId },
        });

        res.json({
            success: true,
            data: { application, documents },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Add comment to application
 */
export const addComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { content, isInternal = false } = req.body;
        const userId = req.user!.userId;

        const application = await prisma.expertApplication.findUnique({
            where: { id },
        });

        if (!application) {
            throw new AppError('Application not found', 404);
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, role: true },
        });

        const comment = await prisma.applicationComment.create({
            data: {
                applicationId: id,
                authorId: userId,
                authorName: user!.name,
                authorRole: user!.role,
                content,
                isInternal,
            },
        });

        res.status(201).json({
            success: true,
            message: 'Comment added successfully',
            data: { comment },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update verification checks (analyst)
 */
export const updateVerificationChecks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { verificationChecks, internalNotes } = req.body;

        const application = await prisma.expertApplication.update({
            where: { id },
            data: {
                verificationChecks,
                internalNotes,
                status: 'UNDER_REVIEW',
            },
        });

        res.json({
            success: true,
            message: 'Verification checks updated',
            data: { application },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Approve application (admin only)
 */
export const approveApplication = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const adminId = req.user!.userId;

        const application = await prisma.expertApplication.findUnique({
            where: { id },
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
        });

        if (!application) {
            throw new AppError('Application not found', 404);
        }

        if (application.status === 'APPROVED') {
            throw new AppError('Application already approved', 400);
        }

        // Update application status
        await prisma.expertApplication.update({
            where: { id },
            data: {
                status: 'APPROVED',
                reviewedBy: adminId,
                reviewedAt: new Date(),
            },
        });

        // Upgrade user role to EXPERT
        await prisma.user.update({
            where: { id: application.userId },
            data: { role: 'EXPERT' },
        });

        // Log activity
        await logActivity({
            userId: adminId,
            action: ACTIONS.APPLICATION_APPROVED,
            entityType: 'ExpertApplication',
            entityId: id,
            metadata: { applicantId: application.userId },
            req,
        });

        // Notify user
        await createNotification({
            userId: application.userId,
            ...NOTIFICATION_TEMPLATES.applicationApproved(),
        });

        // Send email
        await sendApplicationStatusEmail(
            application.user.email,
            application.user.name,
            'approved'
        );

        res.json({
            success: true,
            message: 'Application approved successfully',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Reject application (admin only)
 */
export const rejectApplication = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const adminId = req.user!.userId;

        if (!reason) {
            throw new AppError('Rejection reason is required', 400);
        }

        const application = await prisma.expertApplication.findUnique({
            where: { id },
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
        });

        if (!application) {
            throw new AppError('Application not found', 404);
        }

        // Update application status
        await prisma.expertApplication.update({
            where: { id },
            data: {
                status: 'REJECTED',
                rejectionReason: reason,
                reviewedBy: adminId,
                reviewedAt: new Date(),
            },
        });

        // Log activity
        await logActivity({
            userId: adminId,
            action: ACTIONS.APPLICATION_REJECTED,
            entityType: 'ExpertApplication',
            entityId: id,
            metadata: { applicantId: application.userId, reason },
            req,
        });

        // Notify user
        await createNotification({
            userId: application.userId,
            ...NOTIFICATION_TEMPLATES.applicationRejected(),
        });

        // Send email
        await sendApplicationStatusEmail(
            application.user.email,
            application.user.name,
            'rejected',
            reason
        );

        res.json({
            success: true,
            message: 'Application rejected',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Request clarification (admin)
 */
export const requestClarification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { message } = req.body;
        const adminId = req.user!.userId;

        const application = await prisma.expertApplication.findUnique({
            where: { id },
        });

        if (!application) {
            throw new AppError('Application not found', 404);
        }

        // Update status
        await prisma.expertApplication.update({
            where: { id },
            data: { status: 'REQUIRES_CLARIFICATION' },
        });

        // Add comment
        const admin = await prisma.user.findUnique({
            where: { id: adminId },
            select: { name: true, role: true },
        });

        await prisma.applicationComment.create({
            data: {
                applicationId: id,
                authorId: adminId,
                authorName: admin!.name,
                authorRole: admin!.role,
                content: message,
                isInternal: false,
            },
        });

        // Notify applicant
        await createNotification({
            userId: application.userId,
            type: 'WARNING',
            title: 'Clarification Required',
            message: 'Please provide additional information for your application.',
            link: '/customer/application-status',
        });

        res.json({
            success: true,
            message: 'Clarification requested',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get application statistics
 */
export const getApplicationStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const [total, byStatus, thisMonth] = await Promise.all([
            prisma.expertApplication.count(),
            prisma.expertApplication.groupBy({
                by: ['status'],
                _count: true,
            }),
            prisma.expertApplication.count({
                where: {
                    submittedAt: {
                        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                    },
                },
            }),
        ]);

        res.json({
            success: true,
            data: {
                total,
                byStatus: byStatus.reduce((acc, item) => ({ ...acc, [item.status]: item._count }), {}),
                thisMonth,
            },
        });
    } catch (error) {
        next(error);
    }
};
