import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { prisma } from '../lib/prisma';
import { config } from '../config/index';

// Extend config with Google OAuth settings
const googleConfig = {
    clientID: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
};

passport.use(
    new GoogleStrategy(
        {
            clientID: googleConfig.clientID,
            clientSecret: googleConfig.clientSecret,
            callbackURL: googleConfig.callbackURL,
        },
        async (accessToken: string, refreshToken: string, profile: Profile, done: any) => {
            try {
                const email = profile.emails?.[0]?.value;

                if (!email) {
                    return done(new Error('No email found in Google profile'), null);
                }

                // Check if user exists
                let user = await prisma.user.findUnique({
                    where: { email },
                    include: { profile: true },
                });

                if (!user) {
                    // Create new user with Google OAuth
                    user = await prisma.user.create({
                        data: {
                            email,
                            name: profile.displayName || email.split('@')[0],
                            passwordHash: '', // No password for OAuth users
                            emailVerified: true, // Google already verified the email
                            status: 'ACTIVE',
                            role: 'CUSTOMER',
                            profile: {
                                create: {
                                    avatarUrl: profile.photos?.[0]?.value || null,
                                },
                            },
                        },
                        include: { profile: true },
                    });
                } else if (!user.emailVerified) {
                    // If user exists but email wasn't verified, verify it now
                    user = await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            emailVerified: true,
                            status: 'ACTIVE',
                        },
                        include: { profile: true },
                    });
                }

                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

passport.serializeUser((user: any, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id },
            include: { profile: true },
        });
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

export default passport;
