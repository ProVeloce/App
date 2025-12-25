import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    submitWork,
    addTaskComment,
    completeTask,
    getMyTaskStats,
} from '../controllers/task.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { handleValidation } from '../middleware/handleValidation';
import { createTaskValidator, paginationValidator, uuidParamValidator } from '../middleware/validators';
import { config } from '../config/index';

// Configure multer for submission uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(config.uploadDir, 'submissions'));
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

// Expert routes
router.get('/my-stats', authorize('EXPERT'), getMyTaskStats);

// Admin create task
router.post(
    '/',
    authorize('ADMIN', 'SUPERADMIN'),
    createTaskValidator,
    handleValidation,
    createTask
);

// Get tasks (role-filtered)
router.get(
    '/',
    authorize('EXPERT', 'ADMIN', 'SUPERADMIN'),
    paginationValidator,
    handleValidation,
    getTasks
);

router.get(
    '/:id',
    authorize('EXPERT', 'ADMIN', 'SUPERADMIN'),
    uuidParamValidator('id'),
    handleValidation,
    getTaskById
);

router.patch(
    '/:id',
    authorize('ADMIN', 'SUPERADMIN'),
    uuidParamValidator('id'),
    handleValidation,
    updateTask
);

// Expert submit work
router.post(
    '/:id/submit',
    authorize('EXPERT'),
    uuidParamValidator('id'),
    upload.array('files', 10),
    handleValidation,
    submitWork
);

// Comments
router.post(
    '/:id/comments',
    authorize('EXPERT', 'ADMIN', 'SUPERADMIN'),
    uuidParamValidator('id'),
    handleValidation,
    addTaskComment
);

// Complete task
router.post(
    '/:id/complete',
    authorize('ADMIN', 'SUPERADMIN'),
    uuidParamValidator('id'),
    handleValidation,
    completeTask
);

export default router;
