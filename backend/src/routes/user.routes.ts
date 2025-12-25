import { Router } from 'express';
import {
    getUsers,
    getUserById,
    updateUserRole,
    updateUserStatus,
    deleteUser,
    getUserStats,
} from '../controllers/user.controller';
import { authenticate, authorize, preventSuperAdminModification } from '../middleware/auth.middleware';
import { handleValidation } from '../middleware/handleValidation';
import { paginationValidator, uuidParamValidator } from '../middleware/validators';
import { body } from 'express-validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Admin+ can view users
router.get(
    '/',
    authorize('ADMIN', 'SUPERADMIN'),
    paginationValidator,
    handleValidation,
    getUsers
);

router.get('/stats', authorize('ADMIN', 'SUPERADMIN'), getUserStats);

router.get(
    '/:id',
    authorize('ADMIN', 'SUPERADMIN'),
    uuidParamValidator('id'),
    handleValidation,
    getUserById
);

// Admin+ can modify users
router.patch(
    '/:id/role',
    authorize('ADMIN', 'SUPERADMIN'),
    uuidParamValidator('id'),
    body('role').isIn(['CUSTOMER', 'EXPERT', 'ANALYST', 'ADMIN', 'SUPERADMIN']).withMessage('Invalid role'),
    handleValidation,
    preventSuperAdminModification,
    updateUserRole
);

router.patch(
    '/:id/status',
    authorize('ADMIN', 'SUPERADMIN'),
    uuidParamValidator('id'),
    body('status').isIn(['ACTIVE', 'SUSPENDED', 'DEACTIVATED']).withMessage('Invalid status'),
    handleValidation,
    preventSuperAdminModification,
    updateUserStatus
);

router.delete(
    '/:id',
    authorize('SUPERADMIN'),
    uuidParamValidator('id'),
    handleValidation,
    deleteUser
);

export default router;
