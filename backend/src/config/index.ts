import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5000', 10),

    // Database
    databaseUrl: process.env.DATABASE_URL!,

    // JWT
    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET || 'access_secret_change_me',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh_secret_change_me',
        accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },

    // Session
    sessionTimeoutMinutes: parseInt(process.env.SESSION_TIMEOUT_MINUTES || '30', 10),

    // Email
    smtp: {
        host: process.env.SMTP_HOST || 'smtp.ethereal.email',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
        from: process.env.EMAIL_FROM || 'noreply@proveloce.com',
    },

    // File Upload
    uploadDir: process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'),
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB

    // Frontend URL (remove trailing slash to prevent CORS issues)
    frontendUrl: (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, ''),

    // OTP
    otpExpiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10),
};

// Validate required config
const requiredEnvVars = ['DATABASE_URL'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.warn(`⚠️ Warning: ${envVar} environment variable is not set`);
    }
}
