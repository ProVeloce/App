import { Request, Response, NextFunction, CookieOptions } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { config } from '../config/index';
import { generateTokenPair, revokeRefreshToken, revokeAllUserTokens, verifyRefreshToken } from '../utils/jwt';
import { createOTP, verifyOTP, verifyOTPByEmail } from '../utils/otp';
import { sendOTPEmail, sendWelcomeEmail } from '../utils/email';
import { logActivity, logLoginAttempt, ACTIONS } from '../utils/activity';
import { createNotification, NOTIFICATION_TEMPLATES } from '../utils/notifications';
import { AppError } from '../middleware/errorHandler';

/**
 * Get cookie options for JWT tokens
 */
const getCookieOptions = (maxAge?: number): CookieOptions => ({
    httpOnly: config.cookie.httpOnly,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    maxAge: maxAge ?? config.cookie.maxAge,
    path: '/',
    ...(config.cookie.domain && { domain: config.cookie.domain }),
});

/**
 * Set authentication cookies
 */
const setAuthCookies = (res: Response, accessToken: string, refreshToken: string): void => {
    // Access token cookie - expires in 15 minutes
    res.cookie('accessToken', accessToken, getCookieOptions());
    
    // Refresh token cookie - expires in 15 minutes (same as access token for strict session)
    res.cookie('refreshToken', refreshToken, getCookieOptions());
};

/**
 * Clear authentication cookies
 */
const clearAuthCookies = (res: Response): void => {
    const clearOptions = getCookieOptions(0);
    res.cookie('accessToken', '', clearOptions);
    res.cookie('refreshToken', '', clearOptions);
};

/**
 * Register new user
 */
export const signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { name, email, phone, password } = req.body;

        // Check if user exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    ...(phone ? [{ phone }] : []),
                ],
            },
        });

        if (existingUser) {
            throw new AppError('User with this email or phone already exists', 409);
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                phone,
                passwordHash,
                profile: {
                    create: {},
                },
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
            },
        });

        // Generate and send OTP
        const otp = await createOTP(user.id, 'email_verification');
        await sendOTPEmail(email, otp, 'email_verification');

        // Log activity
        await logActivity({
            userId: user.id,
            action: ACTIONS.USER_SIGNUP,
            metadata: { email },
            req,
        });

        res.status(201).json({
            success: true,
            message: 'Registration successful. Please verify your email.',
            data: { userId: user.id, email: user.email },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Verify OTP for email/phone verification
 */
export const verifyOTPHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, otp, type } = req.body;

        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, name: true, email: true },
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        const isValid = await verifyOTP(user.id, otp, type);

        if (!isValid) {
            throw new AppError('Invalid or expired OTP', 400);
        }

        // Update user status based on type
        if (type === 'email_verification') {
            await prisma.user.update({
                where: { id: user.id },
                data: { emailVerified: true, status: 'ACTIVE' },
            });

            // Send welcome email
            await sendWelcomeEmail(user.email, user.name);

            // Create welcome notification
            await createNotification({
                userId: user.id,
                ...NOTIFICATION_TEMPLATES.welcomeUser(user.name),
            });

            // Log activity
            await logActivity({
                userId: user.id,
                action: ACTIONS.EMAIL_VERIFIED,
                req,
            });
        }

        res.json({
            success: true,
            message: type === 'email_verification'
                ? 'Email verified successfully. You can now login.'
                : 'OTP verified successfully.',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Resend OTP
 */
export const resendOTP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, type } = req.body;

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Generate new OTP
        const otp = await createOTP(user.id, type);
        await sendOTPEmail(email, otp, type);

        res.json({
            success: true,
            message: 'OTP sent successfully.',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Login user
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({
            where: { email },
        });

        // Log failed attempt if user not found
        if (!user) {
            throw new AppError('Invalid email or password', 401);
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            await logLoginAttempt(user.id, false, req);
            throw new AppError('Invalid email or password', 401);
        }

        // Check if email is verified
        if (!user.emailVerified) {
            // Resend OTP
            const otp = await createOTP(user.id, 'email_verification');
            await sendOTPEmail(email, otp, 'email_verification');

            res.status(403).json({
                success: false,
                error: 'Email not verified',
                message: 'Please verify your email. A new OTP has been sent.',
                requiresVerification: true,
            });
            return;
        }

        // Check if account is active
        if (user.status !== 'ACTIVE') {
            throw new AppError(`Account is ${user.status.toLowerCase()}`, 403);
        }

        // Generate tokens
        const tokens = await generateTokenPair({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        // Set tokens in httpOnly cookies
        setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

        // Log successful login
        await logLoginAttempt(user.id, true, req);
        await logActivity({
            userId: user.id,
            action: ACTIONS.USER_LOGIN,
            req,
        });

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    status: user.status,
                },
                tokens, // Also return tokens in response body for backward compatibility
                sessionExpiresIn: config.sessionTimeoutMinutes * 60, // Session expiry in seconds
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Refresh access token
 * Reads refresh token from cookie or request body
 */
export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Try to get refresh token from cookie first, then from body
        const refreshTokenValue = req.cookies?.refreshToken || req.body?.refreshToken;

        if (!refreshTokenValue) {
            clearAuthCookies(res);
            throw new AppError('Refresh token is required', 400);
        }

        const userId = await verifyRefreshToken(refreshTokenValue);

        if (!userId) {
            clearAuthCookies(res);
            throw new AppError('Invalid or expired refresh token. Please log in again.', 401);
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, role: true, status: true },
        });

        if (!user || user.status !== 'ACTIVE') {
            clearAuthCookies(res);
            throw new AppError('User not found or inactive', 401);
        }

        // Revoke old refresh token
        await revokeRefreshToken(refreshTokenValue);

        // Generate new token pair
        const tokens = await generateTokenPair({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        // Set new tokens in cookies
        setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

        res.json({
            success: true,
            data: { 
                tokens,
                sessionExpiresIn: config.sessionTimeoutMinutes * 60,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Forgot password - send OTP
 */
export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email } = req.body;

        const user = await prisma.user.findUnique({
            where: { email },
        });

        // Always return success to prevent email enumeration
        if (!user) {
            res.json({
                success: true,
                message: 'If the email exists, an OTP has been sent.',
            });
            return;
        }

        // Generate and send OTP
        const otp = await createOTP(user.id, 'password_reset');
        await sendOTPEmail(email, otp, 'password_reset');

        res.json({
            success: true,
            message: 'If the email exists, an OTP has been sent.',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Reset password with OTP
 */
export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, otp, newPassword } = req.body;

        const result = await verifyOTPByEmail(email, otp, 'password_reset');

        if (!result.valid || !result.userId) {
            throw new AppError('Invalid or expired OTP', 400);
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(newPassword, 12);

        // Update password
        await prisma.user.update({
            where: { id: result.userId },
            data: { passwordHash },
        });

        // Revoke all refresh tokens (logout from all devices)
        await revokeAllUserTokens(result.userId);

        // Log activity
        await logActivity({
            userId: result.userId,
            action: ACTIONS.PASSWORD_RESET,
            req,
        });

        res.json({
            success: true,
            message: 'Password reset successful. Please login with your new password.',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Change password (authenticated)
 */
export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user!.userId;

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.passwordHash);

        if (!isValid) {
            throw new AppError('Current password is incorrect', 400);
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(newPassword, 12);

        // Update password
        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash },
        });

        // Log activity
        await logActivity({
            userId,
            action: ACTIONS.PASSWORD_CHANGED,
            req,
        });

        res.json({
            success: true,
            message: 'Password changed successfully.',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Logout user
 */
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Get refresh token from cookie or body
        const refreshTokenValue = req.cookies?.refreshToken || req.body?.refreshToken;
        const userId = req.user!.userId;

        if (refreshTokenValue) {
            await revokeRefreshToken(refreshTokenValue);
        }

        // Clear auth cookies
        clearAuthCookies(res);

        // Log activity
        await logActivity({
            userId,
            action: ACTIONS.USER_LOGOUT,
            req,
        });

        res.json({
            success: true,
            message: 'Logged out successfully.',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Logout from all devices
 */
export const logoutAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user!.userId;

        await revokeAllUserTokens(userId);

        // Clear auth cookies for current session
        clearAuthCookies(res);

        // Log activity
        await logActivity({
            userId,
            action: ACTIONS.USER_LOGOUT,
            metadata: { allDevices: true },
            req,
        });

        res.json({
            success: true,
            message: 'Logged out from all devices.',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get current user
 */
export const getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user!.userId;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                emailVerified: true,
                lastLoginAt: true,
                createdAt: true,
                profile: true,
            },
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        res.json({
            success: true,
            data: { user },
        });
    } catch (error) {
        next(error);
    }
};
