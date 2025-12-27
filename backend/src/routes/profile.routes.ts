import { Router } from 'express';
import multer from 'multer';
import {
    getMyProfile,
    updateMyProfile,
    updateAvatar,
    getProfileById,
} from '../controllers/profile.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { handleValidation } from '../middleware/handleValidation';
import { updateProfileValidator, uuidParamValidator } from '../middleware/validators';

// Configure multer for avatar uploads - use memory storage for database storage
const upload = multer({
    storage: multer.memoryStorage(), // Store in memory as buffer
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
