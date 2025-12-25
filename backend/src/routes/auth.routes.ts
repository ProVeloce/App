import { Router, Request, Response } from 'express';
import passport from '../config/passport';
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
import { generateTokenPair } from '../utils/jwt';
import { logActivity, ACTIONS } from '../utils/activity';
import { config } from '../config/index';

const router = Router();

// Public routes
router.post('/signup', signupValidator, handleValidation, signup);
router.post('/login', loginValidator, handleValidation, login);
router.post('/verify-otp', verifyOtpValidator, handleValidation, verifyOTPHandler);
router.post('/resend-otp', forgotPasswordValidator, handleValidation, resendOTP);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPasswordValidator, handleValidation, forgotPassword);
router.post('/reset-password', resetPasswordValidator, handleValidation, resetPassword);

// Google OAuth routes
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
}));

router.get('/google/callback',
    passport.authenticate('google', {
        session: false,
        failureRedirect: `${config.frontendUrl}/login?error=google_auth_failed`,
    }),
    async (req: Request, res: Response) => {
        try {
            const user = req.user as any;

            if (!user) {
                return res.redirect(`${config.frontendUrl}/login?error=no_user`);
            }

            // Generate tokens
            const tokens = await generateTokenPair({
                userId: user.id,
                email: user.email,
                role: user.role,
            });

            // Log activity
            await logActivity({
                userId: user.id,
                action: ACTIONS.USER_LOGIN,
                metadata: { method: 'google_oauth' },
                req,
            });

            // Redirect to frontend with tokens
            const redirectUrl = new URL(`${config.frontendUrl}/auth/callback`);
            redirectUrl.searchParams.set('accessToken', tokens.accessToken);
            redirectUrl.searchParams.set('refreshToken', tokens.refreshToken);

            res.redirect(redirectUrl.toString());
        } catch (error) {
            console.error('Google OAuth callback error:', error);
            res.redirect(`${config.frontendUrl}/login?error=auth_failed`);
        }
    }
);

// Protected routes
router.get('/me', authenticate, getCurrentUser);
router.post('/change-password', authenticate, changePasswordValidator, handleValidation, changePassword);
router.post('/logout', authenticate, logout);
router.post('/logout-all', authenticate, logoutAll);

export default router;
