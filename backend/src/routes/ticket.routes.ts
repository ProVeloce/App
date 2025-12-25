import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
    createTicket,
    getMyTickets,
    getAllTickets,
    getTicketById,
    addMessage,
    assignTicket,
    updateTicketStatus,
    getTicketStats,
} from '../controllers/ticket.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { handleValidation } from '../middleware/handleValidation';
import { createTicketValidator, paginationValidator, uuidParamValidator } from '../middleware/validators';
import { config } from '../config/index';

// Configure multer for ticket attachments
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(config.uploadDir, 'tickets'));
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

// User routes
router.post(
    '/',
    upload.array('attachments', 5),
    createTicketValidator,
    handleValidation,
    createTicket
);

router.get('/my-tickets', paginationValidator, handleValidation, getMyTickets);

// Admin/Analyst routes
router.get(
    '/',
    authorize('ANALYST', 'ADMIN', 'SUPERADMIN'),
    paginationValidator,
    handleValidation,
    getAllTickets
);

router.get(
    '/stats',
    authorize('ADMIN', 'SUPERADMIN'),
    getTicketStats
);

router.get(
    '/:id',
    uuidParamValidator('id'),
    handleValidation,
    getTicketById
);

router.post(
    '/:id/messages',
    uuidParamValidator('id'),
    upload.array('attachments', 5),
    handleValidation,
    addMessage
);

router.patch(
    '/:id/assign',
    authorize('ADMIN', 'SUPERADMIN'),
    uuidParamValidator('id'),
    handleValidation,
    assignTicket
);

router.patch(
    '/:id/status',
    authorize('ANALYST', 'ADMIN', 'SUPERADMIN'),
    uuidParamValidator('id'),
    handleValidation,
    updateTicketStatus
);

export default router;
