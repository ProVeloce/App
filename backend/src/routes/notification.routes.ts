import { Router } from 'express';
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getCount,
} from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';
import { handleValidation } from '../middleware/handleValidation';
import { uuidParamValidator } from '../middleware/validators';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getNotifications);
router.get('/count', getCount);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', uuidParamValidator('id'), handleValidation, markAsRead);
router.delete('/:id', uuidParamValidator('id'), handleValidation, deleteNotification);

export default router;
