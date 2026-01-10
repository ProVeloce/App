import fs from 'fs';
import path from 'path';
import app from './app';
import { config } from './config/index';
import { prisma } from './lib/prisma';

const PORT = config.port;

// Ensure upload directories exist
function ensureUploadDirectories() {
    const directories = [
        config.uploadDir,
        path.join(config.uploadDir, 'avatars'),
        path.join(config.uploadDir, 'documents'),
    ];

    for (const dir of directories) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`📁 Created directory: ${dir}`);
        }
    }
}

async function main() {
    try {
        // Ensure upload directories exist
        ensureUploadDirectories();

        // Test database connection
        await prisma.$connect();
        console.log('✅ Database connected successfully');

        // Start server
        app.listen(PORT, () => {
            console.log(`🚀 ProVeloce Connect API Server running on port ${PORT}`);
            console.log(`📍 Environment: ${config.nodeEnv}`);
            console.log(`🔗 Health check: http://localhost:${PORT}/health`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n👋 Shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n👋 Shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});

main();
