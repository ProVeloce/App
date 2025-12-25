import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { logActivity, ACTIONS } from '../utils/activity';

const router = Router();

router.use(authenticate);
router.use(authorize('SUPERADMIN'));

// Get system config
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const configs = await prisma.systemConfig.findMany();

        res.json({
            success: true,
            data: { configs },
        });
    } catch (error) {
        next(error);
    }
});

// Update system config
router.put('/:key', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { key } = req.params;
        const { value, description } = req.body;
        const updatedBy = req.user!.userId;

        const config = await prisma.systemConfig.upsert({
            where: { key },
            create: { key, value, description, updatedBy },
            update: { value, description, updatedBy },
        });

        await logActivity({
            userId: updatedBy,
            action: ACTIONS.CONFIG_UPDATED,
            entityType: 'SystemConfig',
            entityId: key,
            metadata: { value },
            req,
        });

        res.json({
            success: true,
            message: 'Config updated',
            data: { config },
        });
    } catch (error) {
        next(error);
    }
});

// Get feature toggles
router.get('/features', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const features = await prisma.featureToggle.findMany();

        res.json({
            success: true,
            data: { features },
        });
    } catch (error) {
        next(error);
    }
});

// Toggle feature
router.patch('/features/:name', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name } = req.params;
        const { isEnabled } = req.body;

        const feature = await prisma.featureToggle.upsert({
            where: { name },
            create: { name, isEnabled },
            update: { isEnabled },
        });

        res.json({
            success: true,
            message: `Feature ${isEnabled ? 'enabled' : 'disabled'}`,
            data: { feature },
        });
    } catch (error) {
        next(error);
    }
});

// Get permission matrix (simplified)
router.get('/permissions', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const permissions = {
            CUSTOMER: ['dashboard', 'profile', 'apply_expert', 'application_status', 'notifications', 'help_desk'],
            EXPERT: ['dashboard', 'profile', 'portfolio', 'certifications', 'tasks', 'earnings', 'notifications', 'help_desk'],
            ANALYST: ['dashboard', 'profile', 'expert_verification', 'review_notes', 'tickets', 'notifications'],
            ADMIN: ['dashboard', 'profile', 'user_management', 'expert_review', 'task_assignment', 'reports', 'announcements', 'notifications'],
            SUPERADMIN: ['all'],
        };

        res.json({
            success: true,
            data: { permissions },
        });
    } catch (error) {
        next(error);
    }
});

// Database backup trigger (placeholder)
router.post('/backup', async (req: Request, res: Response, next: NextFunction) => {
    try {
        // In production, this would trigger a database backup job
        res.json({
            success: true,
            message: 'Backup initiated. This is a placeholder - implement actual backup logic.',
            data: {
                timestamp: new Date().toISOString(),
                status: 'initiated',
            },
        });
    } catch (error) {
        next(error);
    }
});

export default router;
