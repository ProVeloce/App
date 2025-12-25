"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seeding...');
    // Hash password for demo accounts
    const passwordHash = await bcryptjs_1.default.hash('Demo@123', 12);
    // Create demo users for each role
    const users = [
        {
            email: 'customer@demo.com',
            phone: '+1234567890',
            name: 'Demo Customer',
            role: client_1.Role.CUSTOMER,
            status: client_1.UserStatus.ACTIVE,
            emailVerified: true,
        },
        {
            email: 'expert@demo.com',
            phone: '+1234567891',
            name: 'Demo Expert',
            role: client_1.Role.EXPERT,
            status: client_1.UserStatus.ACTIVE,
            emailVerified: true,
        },
        {
            email: 'analyst@demo.com',
            phone: '+1234567892',
            name: 'Demo Analyst',
            role: client_1.Role.ANALYST,
            status: client_1.UserStatus.ACTIVE,
            emailVerified: true,
        },
        {
            email: 'admin@demo.com',
            phone: '+1234567893',
            name: 'Demo Admin',
            role: client_1.Role.ADMIN,
            status: client_1.UserStatus.ACTIVE,
            emailVerified: true,
        },
        {
            email: 'superadmin@demo.com',
            phone: '+1234567894',
            name: 'Super Admin',
            role: client_1.Role.SUPERADMIN,
            status: client_1.UserStatus.ACTIVE,
            emailVerified: true,
        },
    ];
    for (const userData of users) {
        const user = await prisma.user.upsert({
            where: { email: userData.email },
            update: {},
            create: {
                ...userData,
                passwordHash,
                profile: {
                    create: {
                        bio: `This is the ${userData.role.toLowerCase()} demo account`,
                        city: 'Demo City',
                        country: 'Demo Country',
                    },
                },
            },
        });
        console.log(`✅ Created/Updated user: ${user.email} (${user.role})`);
    }
    // Create sample system configurations
    const configs = [
        {
            key: 'maintenance_mode',
            value: { enabled: false },
            description: 'Enable/disable maintenance mode',
        },
        {
            key: 'registration_open',
            value: { enabled: true },
            description: 'Allow new user registrations',
        },
        {
            key: 'expert_applications_open',
            value: { enabled: true },
            description: 'Allow expert applications',
        },
    ];
    for (const config of configs) {
        await prisma.systemConfig.upsert({
            where: { key: config.key },
            update: { value: config.value },
            create: config,
        });
        console.log(`✅ Created/Updated config: ${config.key}`);
    }
    // Create sample feature toggles
    const features = [
        { name: 'expert_marketplace', isEnabled: true, description: 'Expert marketplace feature' },
        { name: 'earnings_module', isEnabled: false, description: 'Earnings and payments module' },
        { name: 'chat_system', isEnabled: false, description: 'In-app chat system' },
        { name: 'analytics_dashboard', isEnabled: true, description: 'Analytics dashboard for admins' },
    ];
    for (const feature of features) {
        await prisma.featureToggle.upsert({
            where: { name: feature.name },
            update: { isEnabled: feature.isEnabled },
            create: feature,
        });
        console.log(`✅ Created/Updated feature toggle: ${feature.name}`);
    }
    // Create a sample announcement
    await prisma.announcement.create({
        data: {
            title: 'Welcome to ProVeloce!',
            content: 'We are excited to have you on board. Explore the platform and let us know if you have any questions.',
            targetRoles: [client_1.Role.CUSTOMER, client_1.Role.EXPERT, client_1.Role.ANALYST, client_1.Role.ADMIN],
            isActive: true,
            createdBy: 'system',
        },
    });
    console.log('✅ Created welcome announcement');
    console.log('🎉 Database seeding completed!');
}
main()
    .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map