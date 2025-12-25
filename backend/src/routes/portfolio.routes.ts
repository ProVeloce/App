import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { handleValidation } from '../middleware/handleValidation';
import { uuidParamValidator } from '../middleware/validators';
import { config } from '../config/index';
import { AppError } from '../middleware/errorHandler';

// Configure multer for portfolio uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(config.uploadDir, 'portfolio'));
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${uuidv4()}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: config.maxFileSize },
});

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create portfolio item
router.post(
    '/',
    authorize('EXPERT'),
    upload.array('media', 10),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const expertId = req.user!.userId;
            const { title, description, tags, isPublic } = req.body;

            const mediaUrls = req.files
                ? (req.files as Express.Multer.File[]).map(f => `/uploads/portfolio/${f.filename}`)
                : [];

            const portfolioItem = await prisma.portfolioItem.create({
                data: {
                    expertId,
                    title,
                    description,
                    tags: tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : [],
                    mediaUrls,
                    isPublic: isPublic !== 'false',
                },
            });

            res.status(201).json({
                success: true,
                message: 'Portfolio item created',
                data: { portfolioItem },
            });
        } catch (error) {
            next(error);
        }
    }
);

// Get expert's portfolio
router.get('/my-portfolio', authorize('EXPERT'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const expertId = req.user!.userId;

        const portfolioItems = await prisma.portfolioItem.findMany({
            where: { expertId },
            orderBy: { createdAt: 'desc' },
        });

        res.json({
            success: true,
            data: { portfolioItems },
        });
    } catch (error) {
        next(error);
    }
});

// Get portfolio by expert ID (public)
router.get('/expert/:expertId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { expertId } = req.params;

        const portfolioItems = await prisma.portfolioItem.findMany({
            where: { expertId, isPublic: true },
            orderBy: { createdAt: 'desc' },
        });

        res.json({
            success: true,
            data: { portfolioItems },
        });
    } catch (error) {
        next(error);
    }
});

// Get single portfolio item
router.get('/:id', uuidParamValidator('id'), handleValidation, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const portfolioItem = await prisma.portfolioItem.findUnique({
            where: { id },
        });

        if (!portfolioItem) {
            throw new AppError('Portfolio item not found', 404);
        }

        res.json({
            success: true,
            data: { portfolioItem },
        });
    } catch (error) {
        next(error);
    }
});

// Update portfolio item
router.patch(
    '/:id',
    authorize('EXPERT'),
    uuidParamValidator('id'),
    handleValidation,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const expertId = req.user!.userId;
            const { title, description, tags, isPublic } = req.body;

            const item = await prisma.portfolioItem.findUnique({
                where: { id },
            });

            if (!item || item.expertId !== expertId) {
                throw new AppError('Portfolio item not found', 404);
            }

            const portfolioItem = await prisma.portfolioItem.update({
                where: { id },
                data: {
                    ...(title && { title }),
                    ...(description !== undefined && { description }),
                    ...(tags && { tags: Array.isArray(tags) ? tags : JSON.parse(tags) }),
                    ...(isPublic !== undefined && { isPublic: isPublic !== 'false' }),
                },
            });

            res.json({
                success: true,
                message: 'Portfolio item updated',
                data: { portfolioItem },
            });
        } catch (error) {
            next(error);
        }
    }
);

// Delete portfolio item
router.delete(
    '/:id',
    authorize('EXPERT'),
    uuidParamValidator('id'),
    handleValidation,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const expertId = req.user!.userId;

            const item = await prisma.portfolioItem.findUnique({
                where: { id },
            });

            if (!item || item.expertId !== expertId) {
                throw new AppError('Portfolio item not found', 404);
            }

            await prisma.portfolioItem.delete({
                where: { id },
            });

            res.json({
                success: true,
                message: 'Portfolio item deleted',
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
