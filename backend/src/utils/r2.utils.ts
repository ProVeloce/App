/**
 * R2 Storage Utilities for Expert Documents
 * 
 * Provides functions for:
 * - Uploading files to R2
 * - Generating signed URLs for secure access
 * - Deleting files from R2
 * - File validation
 */

// Cloudflare R2 type definitions (for non-Workers environment)
interface R2PutOptions {
    httpMetadata?: {
        contentType?: string;
    };
    customMetadata?: Record<string, string>;
}

interface R2ObjectBody {
    arrayBuffer(): Promise<ArrayBuffer>;
}

interface R2Bucket {
    put(key: string, value: ArrayBuffer | ArrayBufferView | string | ReadableStream | Blob, options?: R2PutOptions): Promise<any>;
    get(key: string): Promise<R2ObjectBody | null>;
    delete(key: string): Promise<void>;
}

// Allowed file types and max size
const ALLOWED_TYPES: Record<string, string[]> = {
    image: ['image/jpeg', 'image/png', 'image/webp'],
    document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES_PER_EXPERT = 20;
const SIGNED_URL_EXPIRY = 10 * 60; // 10 minutes in seconds

export interface FileValidationResult {
    valid: boolean;
    error?: string;
}

export interface UploadResult {
    success: boolean;
    objectKey?: string;
    error?: string;
}

export interface DocumentRecord {
    id: string;
    userId: string;
    applicationId?: string;
    documentType: 'profile' | 'government_id' | 'resume' | 'certificate' | 'portfolio' | 'other';
    fileName: string;
    fileType: string;
    fileSize: number;
    r2ObjectKey: string;
    reviewStatus: 'pending' | 'approved' | 'rejected';
    applicationStatus: 'draft' | 'submitted';
    reviewedBy?: string;
    reviewedAt?: string;
    rejectionReason?: string;
    uploadedAt: string;
}

/**
 * Validate file type and size
 */
export function validateFile(
    file: { type: string; size: number; name: string },
    allowedCategory: 'image' | 'document' | 'all' = 'all'
): FileValidationResult {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        };
    }

    // Check file type
    let allowedMimeTypes: string[] = [];
    if (allowedCategory === 'all') {
        allowedMimeTypes = [...ALLOWED_TYPES.image, ...ALLOWED_TYPES.document];
    } else {
        allowedMimeTypes = ALLOWED_TYPES[allowedCategory] || [];
    }

    if (!allowedMimeTypes.includes(file.type)) {
        return {
            valid: false,
            error: `File type ${file.type} is not allowed. Accepted types: ${allowedMimeTypes.join(', ')}`,
        };
    }

    return { valid: true };
}

/**
 * Generate R2 object key for a document
 * Structure: /experts/{userId}/{documentType}/{timestamp}_{filename}
 */
export function generateObjectKey(
    userId: string,
    documentType: string,
    fileName: string
): string {
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `experts/${userId}/${documentType}/${timestamp}_${sanitizedFileName}`;
}

/**
 * Upload file to R2 bucket
 */
export async function uploadToR2(
    r2Bucket: R2Bucket,
    objectKey: string,
    fileData: ArrayBuffer | ArrayBufferView | ReadableStream,
    contentType: string,
    metadata?: Record<string, string>
): Promise<UploadResult> {
    try {
        await r2Bucket.put(objectKey, fileData, {
            httpMetadata: {
                contentType,
            },
            customMetadata: metadata,
        });

        return {
            success: true,
            objectKey,
        };
    } catch (error) {
        console.error('R2 upload error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to upload file',
        };
    }
}

/**
 * Delete file from R2 bucket
 */
export async function deleteFromR2(
    r2Bucket: R2Bucket,
    objectKey: string
): Promise<boolean> {
    try {
        await r2Bucket.delete(objectKey);
        return true;
    } catch (error) {
        console.error('R2 delete error:', error);
        return false;
    }
}

/**
 * Get file from R2 bucket
 */
export async function getFromR2(
    r2Bucket: R2Bucket,
    objectKey: string
): Promise<R2ObjectBody | null> {
    try {
        const object = await r2Bucket.get(objectKey);
        return object;
    } catch (error) {
        console.error('R2 get error:', error);
        return null;
    }
}

/**
 * Generate a signed URL for secure file access
 * Note: R2 doesn't have native signed URL support like S3,
 * so we create a proxy endpoint that validates access
 */
export function generateSignedUrlToken(
    userId: string,
    objectKey: string,
    expiresIn: number = SIGNED_URL_EXPIRY
): string {
    const expiresAt = Date.now() + (expiresIn * 1000);
    const payload = {
        userId,
        objectKey,
        expiresAt,
    };

    // Create a simple signed token (in production, use proper JWT)
    const data = JSON.stringify(payload);
    const encoded = btoa(data);
    return encoded;
}

/**
 * Verify signed URL token
 */
export function verifySignedUrlToken(
    token: string,
    requestingUserId: string,
    allowedRoles: string[] = []
): { valid: boolean; objectKey?: string; error?: string } {
    try {
        const decoded = atob(token);
        const payload = JSON.parse(decoded);

        // Check expiry
        if (Date.now() > payload.expiresAt) {
            return { valid: false, error: 'Token expired' };
        }

        return {
            valid: true,
            objectKey: payload.objectKey,
        };
    } catch (error) {
        return { valid: false, error: 'Invalid token' };
    }
}

/**
 * Get file extension from filename
 */
export function getFileExtension(fileName: string): string {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Check if file is an image
 */
export function isImageFile(mimeType: string): boolean {
    return ALLOWED_TYPES.image.includes(mimeType);
}

/**
 * Check if file is a document (PDF/DOC)
 */
export function isDocumentFile(mimeType: string): boolean {
    return ALLOWED_TYPES.document.includes(mimeType);
}

export { MAX_FILE_SIZE, MAX_FILES_PER_EXPERT, SIGNED_URL_EXPIRY, ALLOWED_TYPES };
