/**
 * Document Controller
 * Handles expert document uploads, retrieval, and review
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
    validateFile,
    generateObjectKey,
    uploadToR2,
    deleteFromR2,
    getFromR2,
    generateSignedUrlToken,
    MAX_FILES_PER_EXPERT,
    DocumentRecord,
} from '../utils/r2.utils';

/**
 * Upload a document
 * POST /api/documents/upload
 * Role: CUSTOMER (Expert applicants)
 */
export const uploadDocument = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { documentType } = req.body;
        const file = req.file;

        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        if (!file) {
            return res.status(400).json({ success: false, error: 'No file provided' });
        }

        if (!documentType) {
            return res.status(400).json({ success: false, error: 'Document type is required' });
        }

        const validTypes = ['profile', 'government_id', 'resume', 'certificate', 'portfolio', 'other'];
        if (!validTypes.includes(documentType)) {
            return res.status(400).json({ success: false, error: 'Invalid document type' });
        }

        // Validate file
        const validation = validateFile({
            type: file.mimetype,
            size: file.size,
            name: file.originalname,
        });

        if (!validation.valid) {
            return res.status(400).json({ success: false, error: validation.error });
        }

        const db = req.env?.proveloce_db;
        const r2Bucket = req.env?.EXPERT_DOCS;

        if (!db || !r2Bucket) {
            return res.status(500).json({ success: false, error: 'Storage not configured' });
        }

        // Check max files limit
        const existingDocs = await db.prepare(
            'SELECT COUNT(*) as count FROM expert_documents WHERE user_id = ?'
        ).bind(userId).first<{ count: number }>();

        if (existingDocs && existingDocs.count >= MAX_FILES_PER_EXPERT) {
            return res.status(400).json({
                success: false,
                error: `Maximum ${MAX_FILES_PER_EXPERT} files allowed per expert`,
            });
        }

        // Generate object key and upload to R2
        const objectKey = generateObjectKey(userId, documentType, file.originalname);
        // Convert Buffer to ArrayBuffer for R2 (use Uint8Array to avoid SharedArrayBuffer issue)
        const uint8Array = new Uint8Array(file.buffer);
        const uploadResult = await uploadToR2(
            r2Bucket,
            objectKey,
            uint8Array,
            file.mimetype,
            { userId, documentType }
        );

        if (!uploadResult.success) {
            return res.status(500).json({ success: false, error: uploadResult.error });
        }

        // Get application ID if exists
        const application = await db.prepare(
            'SELECT id FROM expert_applications WHERE user_id = ?'
        ).bind(userId).first<{ id: string }>();

        // Save to database with draft status
        const docId = uuidv4();
        await db.prepare(`
            INSERT INTO expert_documents (
                id, user_id, application_id, document_type, file_name, 
                file_type, file_size, r2_object_key, review_status, application_status, uploaded_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'draft', datetime('now'), datetime('now'))
        `).bind(
            docId,
            userId,
            application?.id || null,
            documentType,
            file.originalname,
            file.mimetype,
            file.size,
            objectKey
        ).run();

        return res.status(201).json({
            success: true,
            data: {
                document: {
                    id: docId,
                    documentType,
                    fileName: file.originalname,
                    fileType: file.mimetype,
                    fileSize: file.size,
                    reviewStatus: 'pending',
                },
            },
        });
    } catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({ success: false, error: 'Failed to upload document' });
    }
};

/**
 * Get signed URL for document preview/download
 * GET /api/documents/:id/url
 * Role: CUSTOMER (own docs), ADMIN, SUPERADMIN
 */
export const getDocumentUrl = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const db = req.env?.proveloce_db;
        const r2Bucket = req.env?.EXPERT_DOCS;

        if (!db || !r2Bucket) {
            return res.status(500).json({ success: false, error: 'Storage not configured' });
        }

        // Get document
        const doc = await db.prepare(
            'SELECT * FROM expert_documents WHERE id = ?'
        ).bind(id).first<DocumentRecord>();

        if (!doc) {
            return res.status(404).json({ success: false, error: 'Document not found' });
        }

        // Check access - experts can only view their own docs
        // Admin/SuperAdmin can only view submitted documents (not drafts)
        const isAdmin = ['ADMIN', 'SUPERADMIN', 'ANALYST'].includes(userRole || '');
        if (!isAdmin && doc.userId !== userId) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        // Admins cannot view draft documents
        if (isAdmin && doc.userId !== userId && doc.applicationStatus === 'draft') {
            return res.status(403).json({ success: false, error: 'Cannot access draft documents' });
        }

        // Get file from R2
        const r2Object = await getFromR2(r2Bucket, doc.r2ObjectKey);
        if (!r2Object) {
            return res.status(404).json({ success: false, error: 'File not found in storage' });
        }

        // Generate signed token for frontend to use
        const token = generateSignedUrlToken(userId, doc.r2ObjectKey);
        const baseUrl = req.headers.origin || 'https://backend.proveloce.com';

        return res.status(200).json({
            success: true,
            data: {
                document: {
                    id: doc.id,
                    fileName: doc.fileName,
                    fileType: doc.fileType,
                    fileSize: doc.fileSize,
                    documentType: doc.documentType,
                    reviewStatus: doc.reviewStatus,
                },
                // Provide URL to stream endpoint
                url: `${baseUrl}/api/documents/${id}/stream?token=${token}`,
                expiresIn: 600, // 10 minutes
            },
        });
    } catch (error) {
        console.error('Get URL error:', error);
        return res.status(500).json({ success: false, error: 'Failed to get document URL' });
    }
};

/**
 * Stream document content (for previewing)
 * GET /api/documents/:id/stream
 * Uses token-based authentication
 */
export const streamDocument = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { token } = req.query;

        if (!token || typeof token !== 'string') {
            return res.status(401).json({ success: false, error: 'Token required' });
        }

        const db = req.env?.proveloce_db;
        const r2Bucket = req.env?.EXPERT_DOCS;

        if (!db || !r2Bucket) {
            return res.status(500).json({ success: false, error: 'Storage not configured' });
        }

        // Get document
        const doc = await db.prepare(
            'SELECT * FROM expert_documents WHERE id = ?'
        ).bind(id).first<DocumentRecord>();

        if (!doc) {
            return res.status(404).json({ success: false, error: 'Document not found' });
        }

        // Get file from R2
        const r2Object = await getFromR2(r2Bucket, doc.r2ObjectKey);
        if (!r2Object) {
            return res.status(404).json({ success: false, error: 'File not found' });
        }

        // Set headers for file download/preview
        res.setHeader('Content-Type', doc.fileType);
        res.setHeader('Content-Length', doc.fileSize.toString());
        res.setHeader('Content-Disposition', `inline; filename="${doc.fileName}"`);
        res.setHeader('Cache-Control', 'private, max-age=600');

        // Stream the file
        const arrayBuffer = await r2Object.arrayBuffer();
        return res.send(Buffer.from(arrayBuffer));
    } catch (error) {
        console.error('Stream error:', error);
        return res.status(500).json({ success: false, error: 'Failed to stream document' });
    }
};

/**
 * Get all documents for an expert
 * GET /api/documents/expert/:userId
 * Role: CUSTOMER (own docs), ADMIN, SUPERADMIN, ANALYST
 */
export const getExpertDocuments = async (req: Request, res: Response) => {
    try {
        const requestingUserId = req.user?.userId;
        const userRole = req.user?.role;
        const { userId } = req.params;

        if (!requestingUserId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        // Check access
        const isAdmin = ['ADMIN', 'SUPERADMIN', 'ANALYST'].includes(userRole || '');
        if (!isAdmin && userId !== requestingUserId) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const db = req.env?.proveloce_db;
        if (!db) {
            return res.status(500).json({ success: false, error: 'Database not configured' });
        }

        // For admins, only return submitted documents (not drafts)
        let query = 'SELECT * FROM expert_documents WHERE user_id = ?';
        if (isAdmin && userId !== requestingUserId) {
            query += " AND application_status = 'submitted'";
        }
        query += ' ORDER BY uploaded_at DESC';

        const documents = await db.prepare(query).bind(userId).all<DocumentRecord>();

        return res.status(200).json({
            success: true,
            data: {
                documents: documents.results || [],
                count: documents.results?.length || 0,
            },
        });
    } catch (error) {
        console.error('Get documents error:', error);
        return res.status(500).json({ success: false, error: 'Failed to get documents' });
    }
};

/**
 * Review document (approve/reject)
 * PUT /api/documents/:id/review
 * Role: ADMIN, SUPERADMIN
 */
export const reviewDocument = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        const { status, rejectionReason } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        if (!status || !['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, error: 'Valid status (approved/rejected) required' });
        }

        if (status === 'rejected' && !rejectionReason) {
            return res.status(400).json({ success: false, error: 'Rejection reason required' });
        }

        const db = req.env?.proveloce_db;
        if (!db) {
            return res.status(500).json({ success: false, error: 'Database not configured' });
        }

        // Update document
        await db.prepare(`
            UPDATE expert_documents 
            SET review_status = ?, reviewed_by = ?, reviewed_at = datetime('now'), 
                rejection_reason = ?, updated_at = datetime('now')
            WHERE id = ?
        `).bind(status, userId, rejectionReason || null, id).run();

        return res.status(200).json({
            success: true,
            message: `Document ${status}`,
        });
    } catch (error) {
        console.error('Review error:', error);
        return res.status(500).json({ success: false, error: 'Failed to review document' });
    }
};

/**
 * Delete document
 * DELETE /api/documents/:id
 * Role: CUSTOMER (own docs, pending only), ADMIN, SUPERADMIN
 */
export const deleteDocument = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const db = req.env?.proveloce_db;
        const r2Bucket = req.env?.EXPERT_DOCS;

        if (!db || !r2Bucket) {
            return res.status(500).json({ success: false, error: 'Storage not configured' });
        }

        // Get document
        const doc = await db.prepare(
            'SELECT * FROM expert_documents WHERE id = ?'
        ).bind(id).first<DocumentRecord>();

        if (!doc) {
            return res.status(404).json({ success: false, error: 'Document not found' });
        }

        // Check access
        const isAdmin = ['ADMIN', 'SUPERADMIN'].includes(userRole || '');
        if (!isAdmin) {
            if (doc.userId !== userId) {
                return res.status(403).json({ success: false, error: 'Access denied' });
            }
            // Experts can only delete pending documents
            if (doc.reviewStatus !== 'pending') {
                return res.status(400).json({ success: false, error: 'Cannot delete reviewed documents' });
            }
        }

        // Delete from R2
        await deleteFromR2(r2Bucket, doc.r2ObjectKey);

        // Delete from database
        await db.prepare('DELETE FROM expert_documents WHERE id = ?').bind(id).run();

        return res.status(200).json({
            success: true,
            message: 'Document deleted',
        });
    } catch (error) {
        console.error('Delete error:', error);
        return res.status(500).json({ success: false, error: 'Failed to delete document' });
    }
};

/**
 * Submit all draft documents (transition from draft to submitted)
 * POST /api/documents/submit
 * Role: CUSTOMER (Expert applicants)
 * This marks all draft documents as submitted, making them visible to Admin/SuperAdmin
 */
export const submitDocuments = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const db = req.env?.proveloce_db;
        if (!db) {
            return res.status(500).json({ success: false, error: 'Database not configured' });
        }

        // Check if user has any draft documents
        const draftDocs = await db.prepare(
            "SELECT COUNT(*) as count FROM expert_documents WHERE user_id = ? AND application_status = 'draft'"
        ).bind(userId).first<{ count: number }>();

        if (!draftDocs || draftDocs.count === 0) {
            return res.status(400).json({ success: false, error: 'No draft documents to submit' });
        }

        // Update all draft documents to submitted
        await db.prepare(`
            UPDATE expert_documents 
            SET application_status = 'submitted', updated_at = datetime('now')
            WHERE user_id = ? AND application_status = 'draft'
        `).bind(userId).run();

        return res.status(200).json({
            success: true,
            message: `${draftDocs.count} document(s) submitted for review`,
            data: {
                submittedCount: draftDocs.count,
            },
        });
    } catch (error) {
        console.error('Submit documents error:', error);
        return res.status(500).json({ success: false, error: 'Failed to submit documents' });
    }
};
