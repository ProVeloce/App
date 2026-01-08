/**
 * Document Routes
 * API endpoints for expert document management with R2 storage
 */

import { Router } from 'express';
import multer from 'multer';
import {
    uploadDocument,
    getDocumentUrl,
    streamDocument,
    getExpertDocuments,
    reviewDocument,
    deleteDocument,
    submitDocuments,
} from '../controllers/document.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Configure multer for file uploads (memory storage for R2)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
});

// All routes require authentication
router.use(authenticate);

// ===================== EXPERT ROUTES =====================

/**
 * Upload a document (saves as draft)
 * POST /api/documents/upload
 * Body: multipart/form-data with 'file' and 'documentType'
 */
router.post(
    '/upload',
    authorize('CUSTOMER'),
    upload.single('file'),
    uploadDocument
);

/**
 * Submit all draft documents for review
 * POST /api/documents/submit
 * Transitions documents from 'draft' to 'submitted'
 */
router.post(
    '/submit',
    authorize('CUSTOMER'),
    submitDocuments
);

/**
 * Get user's own documents (includes drafts)
 * GET /api/documents/my-documents
 */
router.get(
    '/my-documents',
    authorize('CUSTOMER', 'EXPERT'),
    async (req, res) => {
        req.params.userId = req.user?.userId || '';
        return getExpertDocuments(req, res);
    }
);

// ===================== SHARED ROUTES =====================

/**
 * Get signed URL for document preview/download
 * GET /api/documents/:id/url
 */
router.get(
    '/:id/url',
    authorize('CUSTOMER', 'EXPERT', 'ANALYST', 'ADMIN', 'SUPERADMIN'),
    getDocumentUrl
);

/**
 * Stream document content (token-based auth)
 * GET /api/documents/:id/stream
 */
router.get('/:id/stream', streamDocument);

// ===================== ADMIN ROUTES =====================

/**
 * Get all documents for a specific expert
 * GET /api/documents/expert/:userId
 */
router.get(
    '/expert/:userId',
    authorize('ANALYST', 'ADMIN', 'SUPERADMIN'),
    getExpertDocuments
);

/**
 * Review document (approve/reject)
 * PUT /api/documents/:id/review
 * Body: { status: 'approved' | 'rejected', rejectionReason?: string }
 */
router.put(
    '/:id/review',
    authorize('ADMIN', 'SUPERADMIN'),
    reviewDocument
);

/**
 * Delete a document
 * DELETE /api/documents/:id
 */
router.delete(
    '/:id',
    authorize('CUSTOMER', 'ADMIN', 'SUPERADMIN'),
    deleteDocument
);

export default router;
