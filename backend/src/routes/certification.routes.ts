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

// Configure multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(config.uploadDir, 'certifications'));
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

router.use(authenticate);

// Create certification
router.post(
    '/',
    authorize('EXPERT'),
    upload.single('file'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const expertId = req.user!.userId;
            const { name, issuedBy, issueYear, expiryYear } = req.body;

            const certification = await prisma.certification.create({
                data: {
                    expertId,
                    name,
                    issuedBy,
                    issueYear: issueYear ? parseInt(issueYear, 10) : undefined,
                    expiryYear: expiryYear ? parseInt(expiryYear, 10) : undefined,
                    fileUrl: req.file ? `/uploads/certifications/${req.file.filename}` : undefined,
                },
            });

            res.status(201).json({
                success: true,
                message: 'Certification added',
                data: { certification },
            });
        } catch (error) {
            next(error);
        }
    }
);

// Get expert's certifications
router.get('/my-certifications', authorize('EXPERT'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const expertId = req.user!.userId;

        const certifications = await prisma.certification.findMany({
            where: { expertId },
            orderBy: { issueYear: 'desc' },
        });

        res.json({
            success: true,
            data: { certifications },
        });
    } catch (error) {
        next(error);
    }
});

// Update certification
router.patch(
    '/:id',
    authorize('EXPERT'),
    uuidParamValidator('id'),
    handleValidation,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const expertId = req.user!.userId;
            const { name, issuedBy, issueYear, expiryYear } = req.body;

            const cert = await prisma.certification.findUnique({
                where: { id },
            });

            if (!cert || cert.expertId !== expertId) {
                throw new AppError('Certification not found', 404);
            }

            const certification = await prisma.certification.update({
                where: { id },
                data: {
                    ...(name && { name }),
                    ...(issuedBy !== undefined && { issuedBy }),
                    ...(issueYear && { issueYear: parseInt(issueYear, 10) }),
                    ...(expiryYear && { expiryYear: parseInt(expiryYear, 10) }),
                },
            });

            res.json({
                success: true,
                message: 'Certification updated',
                data: { certification },
            });
        } catch (error) {
            next(error);
        }
    }
);

// Delete certification
router.delete(
    '/:id',
    authorize('EXPERT'),
    uuidParamValidator('id'),
    handleValidation,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const expertId = req.user!.userId;

            const cert = await prisma.certification.findUnique({
                where: { id },
            });

            if (!cert || cert.expertId !== expertId) {
                throw new AppError('Certification not found', 404);
            }

            await prisma.certification.delete({
                where: { id },
            });

            res.json({
                success: true,
                message: 'Certification deleted',
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
