import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import AppLogo from '../../components/common/AppLogo';
import './AuthPages.css';

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [transitioning, setTransitioning] = useState(false);
    const { login } = useAuth();
    const { error, success } = useToast();
    const navigate = useNavigate();
    const location = useLocation();

    const from = (location.state as any)?.from?.pathname || '/dashboard';

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginForm) => {
        setIsLoading(true);
        try {
            const result = await login(data.email, data.password);

            if (result.success) {
                success('Login successful!');
                navigate(from, { replace: true });
            } else if (result.requiresVerification) {
                navigate('/verify-otp', { state: { email: data.email, type: 'email_verification' } });
            } else {
                error(result.error || 'Login failed');
            }
        } catch (err) {
            error('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const goToSignup = () => {
        setTransitioning(true);
        setMode('signup');
        // Navigate at 500ms (middle of 1s animation) for content change mid-slide
        setTimeout(() => {
            navigate('/signup');
        }, 500);
    };

    return (
        <div className="auth-page">
            <div className={`auth-container ${mode} ${transitioning ? 'transitioning' : ''}`}>
                {/* Panel 1: Input (Form) */}
                <div className="auth-panel input-panel">
                    <div className="auth-card">
                        <div className="auth-header">
                            <AppLogo showText={true} size="large" className="auth-logo" />
                            <h1>Welcome Back</h1>
                            <p>Sign in to continue to your account</p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
                            <div className="form-group">
                                <label htmlFor="email">Email Address</label>
                                <div className="input-wrapper">
                                    <Mail size={18} className="input-icon" />
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="Enter your email"
                                        {...register('email')}
                                        className={errors.email ? 'error' : ''}
                                    />
                                </div>
                                {errors.email && <span className="error-message">{errors.email.message}</span>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">Password</label>
                                <div className="input-wrapper">
                                    <Lock size={18} className="input-icon" />
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter your password"
                                        {...register('password')}
                                        className={errors.password ? 'error' : ''}
                                    />
                                    <button
                                        type="button"
                                        className="toggle-password"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.password && <span className="error-message">{errors.password.message}</span>}
                            </div>

                            <div className="form-actions">
                                <Link to="/forgot-password" className="forgot-link">
                                    Forgot Password?
                                </Link>
                            </div>

                            <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
                                {isLoading ? 'Signing in...' : 'Sign In'}
                                {!isLoading && <ArrowRight size={18} />}
                            </button>

                            <div className="auth-divider">
                                <span>or</span>
                            </div>

                            <a
                                href={`${import.meta.env.VITE_API_URL || ''}/api/auth/google`}
                                className="btn btn-google btn-block"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Continue with Google
                            </a>
                        </form>

                        <div className="auth-footer">
                            <p>
                                Don't have an account?{' '}
                                <button type="button" onClick={goToSignup} className="auth-link">
                                    Create Account
                                </button>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Panel 2: Non-Input (Branding) */}
                <div className="auth-panel non-input-panel">
                    <div className="visual-content">
                        <h2>Connect with Verified Experts</h2>
                        <p>Join thousands of professionals on the ProVeloce Connect platform</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
