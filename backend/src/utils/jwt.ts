import jwt from 'jsonwebtoken';
import { config } from '../config/index';
import { JWTPayload, TokenPair } from '../types/index';
import { prisma } from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate access token (short-lived)
 */
export const generateAccessToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (jwt.sign as any)(
        { ...payload },
        config.jwt.accessSecret,
        { expiresIn: config.jwt.accessExpiresIn }
    );
};

/**
 * Parse duration string (e.g., '15m', '7d', '1h') to milliseconds
 */
const parseDurationToMs = (duration: string): number => {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) {
        // Default to 15 minutes if parsing fails
        return 15 * 60 * 1000;
    }
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: return 15 * 60 * 1000;
    }
};

/**
 * Generate refresh token (stored in database)
 * Expiry matches session timeout (15 minutes by default)
 */
export const generateRefreshToken = async (userId: string): Promise<string> => {
    const token = uuidv4();

    // Calculate expiry based on config
    const expiresInMs = parseDurationToMs(config.jwt.refreshExpiresIn);
    const expiresAt = new Date(Date.now() + expiresInMs);

    // Store in database
    await prisma.refreshToken.create({
        data: {
            userId,
            token,
            expiresAt,
        },
    });

    return token;
};

/**
 * Generate both access and refresh tokens
 */
export const generateTokenPair = async (
    payload: Omit<JWTPayload, 'iat' | 'exp'>
): Promise<TokenPair> => {
    const accessToken = generateAccessToken(payload);
    const refreshToken = await generateRefreshToken(payload.userId);

    return { accessToken, refreshToken };
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): JWTPayload | null => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (jwt.verify as any)(token, config.jwt.accessSecret) as JWTPayload;
    } catch {
        return null;
    }
};

/**
 * Verify and consume refresh token
 */
export const verifyRefreshToken = async (token: string): Promise<string | null> => {
    const refreshToken = await prisma.refreshToken.findUnique({
        where: { token },
    });

    if (!refreshToken) {
        return null;
    }

    // Check if expired
    if (refreshToken.expiresAt < new Date()) {
        await prisma.refreshToken.delete({ where: { id: refreshToken.id } });
        return null;
    }

    // Check if revoked
    if (refreshToken.revokedAt) {
        return null;
    }

    return refreshToken.userId;
};

/**
 * Revoke a refresh token
 */
export const revokeRefreshToken = async (token: string): Promise<void> => {
    await prisma.refreshToken.updateMany({
        where: { token },
        data: { revokedAt: new Date() },
    });
};

/**
 * Revoke all refresh tokens for a user (logout from all devices)
 */
export const revokeAllUserTokens = async (userId: string): Promise<void> => {
    await prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
    });
};

/**
 * Clean up expired tokens (run periodically)
 */
export const cleanupExpiredTokens = async (): Promise<number> => {
    const result = await prisma.refreshToken.deleteMany({
        where: {
            OR: [
                { expiresAt: { lt: new Date() } },
                { revokedAt: { not: null } },
            ],
        },
    });
    return result.count;
};
