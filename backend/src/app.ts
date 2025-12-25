import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config } from './config/index';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import profileRoutes from './routes/profile.routes';
import applicationRoutes from './routes/application.routes';
import documentRoutes from './routes/document.routes';
import portfolioRoutes from './routes/portfolio.routes';
import certificationRoutes from './routes/certification.routes';
import taskRoutes from './routes/task.routes';
import ticketRoutes from './routes/ticket.routes';
import notificationRoutes from './routes/notification.routes';
import activityRoutes from './routes/activity.routes';
import adminRoutes from './routes/admin.routes';
import configRoutes from './routes/config.routes';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
    origin: config.frontendUrl,
    credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files for uploads
app.use('/uploads', express.static(config.uploadDir));

// Root route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'ProVeloce API Server',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            api: '/api/*'
        }
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/certifications', certificationRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/config', configRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
