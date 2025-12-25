import app from './app';
import { config } from './config/index';
import { prisma } from './lib/prisma';

const PORT = config.port;

async function main() {
    try {
        // Test database connection
        await prisma.$connect();
        console.log('✅ Database connected successfully');

        // Start server
        app.listen(PORT, () => {
            console.log(`🚀 ProVeloce API Server running on port ${PORT}`);
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
