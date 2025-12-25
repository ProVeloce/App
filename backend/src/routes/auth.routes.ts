import { Router } from 'express';
import {
    signup,
    login,
    verifyOTPHandler,
    resendOTP,
    refreshToken,
    forgotPassword,
    resetPassword,
    changePassword,
    logout,
    logoutAll,
    getCurrentUser,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { handleValidation } from '../middleware/handleValidation';
import {
    signupValidator,
    loginValidator,
    verifyOtpValidator,
    forgotPasswordValidator,
    resetPasswordValidator,
    changePasswordValidator,
} from '../middleware/validators';

const router = Router();

// Public routes
router.post('/signup', signupValidator, handleValidation, signup);
router.post('/login', loginValidator, handleValidation, login);
router.post('/verify-otp', verifyOtpValidator, handleValidation, verifyOTPHandler);
router.post('/resend-otp', forgotPasswordValidator, handleValidation, resendOTP);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPasswordValidator, handleValidation, forgotPassword);
router.post('/reset-password', resetPasswordValidator, handleValidation, resetPassword);

// Protected routes
router.get('/me', authenticate, getCurrentUser);
router.post('/change-password', authenticate, changePasswordValidator, handleValidation, changePassword);
router.post('/logout', authenticate, logout);
router.post('/logout-all', authenticate, logoutAll);

export default router;
