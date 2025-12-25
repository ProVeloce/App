import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import VerifyOTPPage from './pages/auth/VerifyOTPPage';

// Common Pages
import Dashboard from './pages/common/Dashboard';
import Profile from './pages/common/Profile';
import Notifications from './pages/common/Notifications';
import HelpDesk from './pages/common/HelpDesk';
import ChangePassword from './pages/common/ChangePassword';

// Customer Pages
import ExpertApplication from './pages/customer/ExpertApplication';
import ApplicationStatus from './pages/customer/ApplicationStatus';

// Expert Pages
import ExpertDashboard from './pages/expert/ExpertDashboard';
import PortfolioManager from './pages/expert/PortfolioManager';
import CertificationsManager from './pages/expert/CertificationsManager';
import TaskManagement from './pages/expert/TaskManagement';
import Earnings from './pages/expert/Earnings';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import ExpertReviewCenter from './pages/admin/ExpertReviewCenter';
import TaskAssignment from './pages/admin/TaskAssignment';
import ReportsAnalytics from './pages/admin/ReportsAnalytics';

// Analyst Pages
import AnalystDashboard from './pages/analyst/AnalystDashboard';
import ExpertVerification from './pages/analyst/ExpertVerification';

// SuperAdmin Pages
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import AdminManagement from './pages/superadmin/AdminManagement';
import GlobalConfig from './pages/superadmin/GlobalConfig';
import SystemLogs from './pages/superadmin/SystemLogs';

// Route Guards
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleRoute from './components/auth/RoleRoute';

function App() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner" />
                <p>Loading ProVeloce...</p>
            </div>
        );
    }

    return (
        <Routes>
            {/* Public Routes */}
            <Route element={<PublicLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />} />
                <Route path="/signup" element={!isAuthenticated ? <SignupPage /> : <Navigate to="/dashboard" />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/verify-otp" element={<VerifyOTPPage />} />
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
    );
}

export default App;
