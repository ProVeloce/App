import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
    getMyProfile,
    updateMyProfile,
    updateAvatar,
    getProfileById,
} from '../controllers/profile.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { handleValidation } from '../middleware/handleValidation';
import { updateProfileValidator, uuidParamValidator } from '../middleware/validators';
import { config } from '../config/index';

// Configure multer for avatar uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(config.uploadDir, 'avatars'));
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${uuidv4()}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
        }
    },
});

const router = Router();

// All routes require authentication
router.use(authenticate);

// Current user profile
router.get('/me', getMyProfile);
router.patch('/me', updateProfileValidator, handleValidation, updateMyProfile);
router.post('/me/avatar', upload.single('avatar'), updateAvatar);

// Admin view profile by ID
router.get(
    '/:id',
    authorize('ADMIN', 'SUPERADMIN'),
    uuidParamValidator('id'),
    handleValidation,
    getProfileById
);

export default router;
