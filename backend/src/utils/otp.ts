import { prisma } from '../lib/prisma';
import { config } from '../config/index';

/**
 * Generate a 6-digit OTP
 */
export const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Create and store OTP for a user
 */
export const createOTP = async (
    userId: string,
    type: 'email_verification' | 'phone_verification' | 'password_reset'
): Promise<string> => {
    // Invalidate any existing OTPs of the same type
    await prisma.oTPCode.updateMany({
        where: {
            userId,
            type,
            usedAt: null,
        },
        data: {
            usedAt: new Date(), // Mark as used to invalidate
        },
    });

    const code = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + config.otpExpiryMinutes);

    await prisma.oTPCode.create({
        data: {
            userId,
            code,
            type,
            expiresAt,
        },
    });

    console.log(`🔐 OTP Created: ${code} for user ${userId} (type: ${type}), expires at: ${expiresAt}`);

    return code;
};

/**
 * Verify OTP
 */
export const verifyOTP = async (
    userId: string,
    code: string,
    type: string
): Promise<boolean> => {
    console.log(`🔍 Verifying OTP: ${code} for user ${userId} (type: ${type})`);

    const otp = await prisma.oTPCode.findFirst({
        where: {
            userId,
            code,
            type,
            usedAt: null,
            expiresAt: { gt: new Date() },
        },
    });

    if (!otp) {
        // Debug: log all OTPs for this user to see what's stored
        const allOtps = await prisma.oTPCode.findMany({
            where: { userId, type },
            orderBy: { createdAt: 'desc' },
            take: 3,
        });
        console.log(`❌ OTP not found. Recent OTPs for user:`, allOtps.map(o => ({
            code: o.code,
            type: o.type,
            expiresAt: o.expiresAt,
            usedAt: o.usedAt,
            isExpired: o.expiresAt < new Date(),
        })));
        return false;
    }

    console.log(`✅ OTP verified successfully`);

    // Mark OTP as used
    await prisma.oTPCode.update({
        where: { id: otp.id },
        data: { usedAt: new Date() },
    });

    return true;
};

/**
 * Get OTP by email and type (for password reset flow where we don't have userId yet)
 */
export const verifyOTPByEmail = async (
    email: string,
    code: string,
    type: string
): Promise<{ valid: boolean; userId?: string }> => {
    const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
    });

    if (!user) {
        return { valid: false };
    }

    const valid = await verifyOTP(user.id, code, type);
    return { valid, userId: valid ? user.id : undefined };
};

/**
 * Clean up expired OTPs (run periodically)
 */
export const cleanupExpiredOTPs = async (): Promise<number> => {
    const result = await prisma.oTPCode.deleteMany({
        where: {
            OR: [
                { expiresAt: { lt: new Date() } },
                { usedAt: { not: null } },
            ],
        },
    });
    return result.count;
};
