import { PrismaClient, Role, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');

    // Hash password for demo accounts
    const passwordHash = await bcrypt.hash('Demo@123', 12);

    // Create demo users for each role
    const users = [
        {
            email: 'customer@demo.com',
            phone: '+1234567890',
            name: 'Demo Customer',
            role: Role.CUSTOMER,
            status: UserStatus.ACTIVE,
            emailVerified: true,
        },
        {
            email: 'expert@demo.com',
            phone: '+1234567891',
            name: 'Demo Expert',
            role: Role.EXPERT,
            status: UserStatus.ACTIVE,
            emailVerified: true,
        },
        {
            email: 'analyst@demo.com',
            phone: '+1234567892',
            name: 'Demo Analyst',
            role: Role.ANALYST,
            status: UserStatus.ACTIVE,
            emailVerified: true,
        },
        {
            email: 'admin@demo.com',
            phone: '+1234567893',
            name: 'Demo Admin',
            role: Role.ADMIN,
            status: UserStatus.ACTIVE,
            emailVerified: true,
        },
        {
            email: 'superadmin@demo.com',
            phone: '+1234567894',
            name: 'Super Admin',
            role: Role.SUPERADMIN,
            status: UserStatus.ACTIVE,
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
            targetRoles: [Role.CUSTOMER, Role.EXPERT, Role.ANALYST, Role.ADMIN],
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
