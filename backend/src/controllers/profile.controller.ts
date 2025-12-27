import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { logActivity, ACTIONS } from '../utils/activity';

/**
 * Get current user's profile
 */
export const getMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
                createdAt: true,
                profile: true,
            },
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Calculate profile completion percentage
        const profileFields = [
            user.name,
            user.phone,
            user.profile?.dob,
            user.profile?.gender,
            user.profile?.addressLine1,
            user.profile?.city,
            user.profile?.state,
            user.profile?.country,
            user.profile?.pincode,
            user.profile?.avatarUrl,
            user.profile?.bio,
        ];
        const filledFields = profileFields.filter(Boolean).length;
        const completionPercentage = Math.round((filledFields / profileFields.length) * 100);

        res.json({
            success: true,
            data: {
                user,
                profileCompletion: completionPercentage,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update current user's profile
 */
export const updateMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const {
            name,
            phone,
            dob,
            gender,
            addressLine1,
            addressLine2,
            city,
            state,
            country,
            pincode,
            bio,
        } = req.body;

        // Update user basic info
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                ...(name && { name }),
                ...(phone && { phone }),
                updatedBy: userId,
                profile: {
                    upsert: {
                        create: {
                            dob: dob ? new Date(dob) : undefined,
                            gender,
                            addressLine1,
                            addressLine2,
                            city,
                            state,
                            country,
                            pincode,
                            bio,
                        },
                        update: {
                            ...(dob && { dob: new Date(dob) }),
                            ...(gender !== undefined && { gender }),
                            ...(addressLine1 !== undefined && { addressLine1 }),
                            ...(addressLine2 !== undefined && { addressLine2 }),
                            ...(city !== undefined && { city }),
                            ...(state !== undefined && { state }),
                            ...(country !== undefined && { country }),
                            ...(pincode !== undefined && { pincode }),
                            ...(bio !== undefined && { bio }),
                        },
                    },
                },
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                profile: true,
            },
        });

        await logActivity({
            userId,
            action: ACTIONS.PROFILE_UPDATED,
            req,
        });

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: { user: updatedUser },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update profile avatar - stores image as Base64 in database
 */
export const updateAvatar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user!.userId;

        if (!req.file) {
            throw new AppError('No file uploaded', 400);
        }

        // Convert file buffer to Base64
        const avatarData = req.file.buffer.toString('base64');
        const avatarMimeType = req.file.mimetype;

        // Create a data URL for the avatar
        const avatarUrl = `data:${avatarMimeType};base64,${avatarData}`;

        await prisma.userProfile.upsert({
            where: { userId },
            create: {
                userId,
                avatarData,
                avatarMimeType,
                avatarUrl, // Store data URL for backward compatibility
            },
            update: {
                avatarData,
                avatarMimeType,
                avatarUrl, // Store data URL for backward compatibility
            },
        });

        await logActivity({
            userId,
            action: ACTIONS.AVATAR_UPLOADED,
            req,
        });

        res.json({
            success: true,
            message: 'Avatar updated successfully',
            data: { avatarUrl },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get profile by user ID (for admin view)
 */
export const getProfileById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                status: true,
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
