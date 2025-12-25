import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize, authorizeOwnerOrAdmin } from '../middleware/auth.middleware';
import { handleValidation } from '../middleware/handleValidation';
import { uuidParamValidator } from '../middleware/validators';
import { logActivity, ACTIONS } from '../utils/activity';
import { config } from '../config/index';
import { AppError } from '../middleware/errorHandler';

// Configure multer for document uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(config.uploadDir, 'documents'));
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${uuidv4()}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: config.maxFileSize },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    },
});

const router = Router();

// All routes require authentication
router.use(authenticate);

// Upload document
router.post('/', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const { type, name } = req.body;

        if (!req.file) {
            throw new AppError('No file uploaded', 400);
        }

        const document = await prisma.document.create({
            data: {
                userId,
                type: type || 'OTHER',
                name: name || req.file.originalname,
                fileUrl: `/uploads/documents/${req.file.filename}`,
                mimeType: req.file.mimetype,
                size: req.file.size,
            },
        });

        await logActivity({
            userId,
            action: ACTIONS.DOCUMENT_UPLOADED,
            entityType: 'Document',
            entityId: document.id,
            req,
        });

        res.status(201).json({
            success: true,
            message: 'Document uploaded successfully',
            data: { document },
        });
    } catch (error) {
        next(error);
    }
});

// Get user's documents
router.get('/my-documents', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const { type } = req.query;

        const where: any = { userId };
        if (type) {
            where.type = type;
        }

        const documents = await prisma.document.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });

        res.json({
            success: true,
            data: { documents },
        });
    } catch (error) {
        next(error);
    }
});

// Get document by ID
router.get(
    '/:id',
    uuidParamValidator('id'),
    handleValidation,
    authorizeOwnerOrAdmin(async (req) => {
        const doc = await prisma.document.findUnique({
            where: { id: req.params.id },
            select: { userId: true },
        });
        return doc?.userId || null;
    }),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;

            const document = await prisma.document.findUnique({
                where: { id },
            });

            if (!document) {
                throw new AppError('Document not found', 404);
            }

            res.json({
                success: true,
                data: { document },
            });
        } catch (error) {
            next(error);
        }
    }
);

// Delete document
router.delete(
    '/:id',
    uuidParamValidator('id'),
    handleValidation,
    authorizeOwnerOrAdmin(async (req) => {
        const doc = await prisma.document.findUnique({
            where: { id: req.params.id },
            select: { userId: true },
        });
        return doc?.userId || null;
    }),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const userId = req.user!.userId;

            await prisma.document.delete({
                where: { id },
            });

            await logActivity({
                userId,
                action: ACTIONS.DOCUMENT_DELETED,
                entityType: 'Document',
                entityId: id,
                req,
            });

            res.json({
                success: true,
                message: 'Document deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    }
);

// Verify document (Admin)
router.patch(
    '/:id/verify',
    authorize('ADMIN', 'SUPERADMIN'),
    uuidParamValidator('id'),
    handleValidation,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const adminId = req.user!.userId;

            const document = await prisma.document.update({
                where: { id },
                data: {
                    isVerified: true,
                    verifiedBy: adminId,
                    verifiedAt: new Date(),
                },
            });

            await logActivity({
                userId: adminId,
                action: ACTIONS.DOCUMENT_VERIFIED,
                entityType: 'Document',
                entityId: id,
                req,
            });

            res.json({
                success: true,
                message: 'Document verified',
                data: { document },
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
