import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useAuth } from './context/AuthContext';
import PremiumLoader from './components/common/PremiumLoader';

// Layouts (keep sync - they're small and needed immediately)
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Route Guards (keep sync)
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleRoute from './components/auth/RoleRoute';

// =====================================================
// Lazy-loaded Pages - Split by Portal
// =====================================================

// Public Pages
const LandingPage = lazy(() => import('./pages/public/LandingPage'));
const PrivacyPolicy = lazy(() => import('./pages/public/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/public/TermsOfService'));

// Auth Pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const SignupPage = lazy(() => import('./pages/auth/SignupPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const VerifyOTPPage = lazy(() => import('./pages/auth/VerifyOTPPage'));
const AuthCallback = lazy(() => import('./pages/auth/AuthCallback'));
const AuthSuccess = lazy(() => import('./pages/auth/AuthSuccess'));
const AuthError = lazy(() => import('./pages/auth/AuthError'));

// Common Pages
const Dashboard = lazy(() => import('./pages/common/Dashboard'));
const Profile = lazy(() => import('./pages/common/Profile'));
const Notifications = lazy(() => import('./pages/common/Notifications'));
const HelpDesk = lazy(() => import('./pages/common/HelpDesk'));
const ChangePassword = lazy(() => import('./pages/common/ChangePassword'));

// Customer Portal
const ExpertApplication = lazy(() => import('./pages/customer/ExpertApplication'));
const ApplicationStatus = lazy(() => import('./pages/customer/ApplicationStatus'));

// Expert Portal
const ExpertDashboard = lazy(() => import('./pages/expert/ExpertDashboard'));
const PortfolioManager = lazy(() => import('./pages/expert/PortfolioManager'));
const CertificationsManager = lazy(() => import('./pages/expert/CertificationsManager'));
const TaskManagement = lazy(() => import('./pages/expert/TaskManagement'));
const Earnings = lazy(() => import('./pages/expert/Earnings'));

// Admin Portal
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const ExpertReviewCenter = lazy(() => import('./pages/admin/ExpertReviewCenter'));
const TaskAssignment = lazy(() => import('./pages/admin/TaskAssignment'));
const ReportsAnalytics = lazy(() => import('./pages/admin/ReportsAnalytics'));
const TicketManagement = lazy(() => import('./pages/admin/TicketManagement'));

// Analyst Portal
const AnalystDashboard = lazy(() => import('./pages/analyst/AnalystDashboard'));
const ExpertVerification = lazy(() => import('./pages/analyst/ExpertVerification'));

// SuperAdmin Portal
const SuperAdminDashboard = lazy(() => import('./pages/superadmin/SuperAdminDashboard'));
const AdminManagement = lazy(() => import('./pages/superadmin/AdminManagement'));
const GlobalConfig = lazy(() => import('./pages/superadmin/GlobalConfig'));
const SystemLogs = lazy(() => import('./pages/superadmin/SystemLogs'));

function App() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <PremiumLoader />;
    }

    return (
        <Suspense fallback={<PremiumLoader />}>
            <Routes>
                {/* Public Routes */}
                <Route element={<PublicLayout />}>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/terms" element={<TermsOfService />} />
                    <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />} />
                    <Route path="/signup" element={!isAuthenticated ? <SignupPage /> : <Navigate to="/dashboard" />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/verify-otp" element={<VerifyOTPPage />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/auth/success" element={<AuthSuccess />} />
                    <Route path="/auth/error" element={<AuthError />} />
                </Route>

                {/* Protected Routes */}
                <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                    {/* Common Routes (All Authenticated Users) */}
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/help-desk" element={<HelpDesk />} />
                    <Route path="/change-password" element={<ChangePassword />} />

                    {/* Customer Routes */}
                    <Route element={<RoleRoute allowedRoles={['CUSTOMER']} />}>
                        <Route path="/customer/apply-expert" element={<ExpertApplication />} />
                        <Route path="/customer/application-status" element={<ApplicationStatus />} />
                    </Route>

                    {/* Expert Routes */}
                    <Route element={<RoleRoute allowedRoles={['EXPERT']} />}>
                        <Route path="/expert/dashboard" element={<ExpertDashboard />} />
                        <Route path="/expert/portfolio" element={<PortfolioManager />} />
                        <Route path="/expert/certifications" element={<CertificationsManager />} />
                        <Route path="/expert/tasks" element={<TaskManagement />} />
                        <Route path="/expert/earnings" element={<Earnings />} />
                    </Route>

                    {/* Analyst Routes */}
                    <Route element={<RoleRoute allowedRoles={['ANALYST', 'ADMIN', 'SUPERADMIN']} />}>
                        <Route path="/analyst/dashboard" element={<AnalystDashboard />} />
                        <Route path="/analyst/verification" element={<ExpertVerification />} />
                    </Route>

                    {/* Admin Routes */}
                    <Route element={<RoleRoute allowedRoles={['ADMIN', 'SUPERADMIN']} />}>
                        <Route path="/admin/dashboard" element={<AdminDashboard />} />
                        <Route path="/admin/users" element={<UserManagement />} />
                        <Route path="/admin/expert-review" element={<ExpertReviewCenter />} />
                        <Route path="/admin/task-assignment" element={<TaskAssignment />} />
                        <Route path="/admin/reports" element={<ReportsAnalytics />} />
                        <Route path="/admin/tickets" element={<TicketManagement />} />
                    </Route>

                    {/* SuperAdmin Routes */}
                    <Route element={<RoleRoute allowedRoles={['SUPERADMIN']} />}>
                        <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
                        <Route path="/superadmin/admins" element={<AdminManagement />} />
                        <Route path="/superadmin/config" element={<GlobalConfig />} />
                        <Route path="/superadmin/logs" element={<SystemLogs />} />
                    </Route>
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Suspense>
    );
}

export default App;
