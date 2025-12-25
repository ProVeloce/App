import { Router } from 'express';
import {
    submitApplication,
    saveDraft,
    getMyApplication,
    getApplications,
    getApplicationById,
    addComment,
    updateVerificationChecks,
    approveApplication,
    rejectApplication,
    requestClarification,
    getApplicationStats,
} from '../controllers/application.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { handleValidation } from '../middleware/handleValidation';
import { expertApplicationValidator, paginationValidator, uuidParamValidator } from '../middleware/validators';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Customer routes
router.post('/submit', authorize('CUSTOMER'), expertApplicationValidator, handleValidation, submitApplication);
router.post('/draft', authorize('CUSTOMER'), saveDraft);
router.get('/my-application', authorize('CUSTOMER', 'EXPERT'), getMyApplication);

// Admin/Analyst routes
router.get(
    '/',
    authorize('ANALYST', 'ADMIN', 'SUPERADMIN'),
    paginationValidator,
    handleValidation,
    getApplications
);

router.get('/stats', authorize('ADMIN', 'SUPERADMIN'), getApplicationStats);

router.get(
    '/:id',
    authorize('ANALYST', 'ADMIN', 'SUPERADMIN'),
    uuidParamValidator('id'),
    handleValidation,
    getApplicationById
);

router.post(
    '/:id/comments',
    authorize('ANALYST', 'ADMIN', 'SUPERADMIN'),
    uuidParamValidator('id'),
    handleValidation,
    addComment
);

// Analyst routes
router.patch(
    '/:id/verification',
    authorize('ANALYST', 'ADMIN', 'SUPERADMIN'),
    uuidParamValidator('id'),
    handleValidation,
    updateVerificationChecks
);

// Admin only routes
router.post(
    '/:id/approve',
    authorize('ADMIN', 'SUPERADMIN'),
    uuidParamValidator('id'),
    handleValidation,
    approveApplication
);

router.post(
    '/:id/reject',
    authorize('ADMIN', 'SUPERADMIN'),
    uuidParamValidator('id'),
    handleValidation,
    rejectApplication
);

router.post(
    '/:id/request-clarification',
    authorize('ADMIN', 'SUPERADMIN'),
    uuidParamValidator('id'),
    handleValidation,
    requestClarification
);

export default router;
