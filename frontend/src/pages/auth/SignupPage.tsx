import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight, Check } from 'lucide-react';
import './AuthPages.css';

const signupSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional().or(z.literal('')),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Must contain at least one number')
        .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Must contain at least one special character'),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((val) => val === true, 'You must accept the terms'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

type SignupForm = z.infer<typeof signupSchema>;

const SignupPage: React.FC = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { signup } = useAuth();
    const { error, success } = useToast();
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<SignupForm>({
        resolver: zodResolver(signupSchema),
    });

    const password = watch('password', '');

    const passwordCriteria = [
        { met: password.length >= 8, label: 'At least 8 characters' },
        { met: /[A-Z]/.test(password), label: 'One uppercase letter' },
        { met: /[a-z]/.test(password), label: 'One lowercase letter' },
        { met: /[0-9]/.test(password), label: 'One number' },
        { met: /[!@#$%^&*(),.?":{}|<>]/.test(password), label: 'One special character' },
    ];

    const onSubmit = async (data: SignupForm) => {
        setIsLoading(true);
        try {
            const result = await signup(data.name, data.email, data.phone || '', data.password);

            if (result.success) {
                success('Account created! Please verify your email.');
                navigate('/verify-otp', { state: { email: data.email, type: 'email_verification' } });
            } else {
                error(result.error || 'Signup failed');
            }
        } catch (err) {
            error('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card signup-card">
                    <div className="auth-header">
                        <Link to="/" className="auth-logo">ProVeloce Connect</Link>
                        <h1>Create Account</h1>
                        <p>Join the ProVeloce expert community</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="name">Full Name *</label>
                            <div className="input-wrapper">
                                <User size={18} className="input-icon" />
                                <input
                                    id="name"
                                    type="text"
                                    placeholder="Enter your Full Name"
                                    {...register('name')}
                                    className={errors.name ? 'error' : ''}
                                />
                            </div>
                            {errors.name && <span className="error-message">{errors.name.message}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email Address *</label>
                            <div className="input-wrapper">
                                <Mail size={18} className="input-icon" />
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="Enter your Email"
                                    {...register('email')}
                                    className={errors.email ? 'error' : ''}
                                />
                            </div>
                            {errors.email && <span className="error-message">{errors.email.message}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="phone">Phone Number</label>
                            <div className="input-wrapper">
                                <Phone size={18} className="input-icon" />
                                <input
                                    id="phone"
                                    type="tel"
                                    placeholder="Enter your Phone Number"
                                    {...register('phone')}
                                    className={errors.phone ? 'error' : ''}
                                />
                            </div>
                            {errors.phone && <span className="error-message">{errors.phone.message}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password *</label>
                            <div className="input-wrapper">
                                <Lock size={18} className="input-icon" />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Create a password"
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
                            <div className="password-criteria">
                                {passwordCriteria.map((criterion, index) => (
                                    <div key={index} className={`criterion ${criterion.met ? 'met' : ''}`}>
                                        <Check size={14} />
                                        <span>{criterion.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password *</label>
                            <div className="input-wrapper">
                                <Lock size={18} className="input-icon" />
                                <input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="Confirm your password"
                                    {...register('confirmPassword')}
                                    className={errors.confirmPassword ? 'error' : ''}
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <span className="error-message">{errors.confirmPassword.message}</span>
                            )}
                        </div>

                        <div className="form-group checkbox-group">
                            <label className="checkbox-label">
                                <input type="checkbox" {...register('acceptTerms')} />
                                <span className="checkmark"></span>
                                <span>
                                    I agree to the{' '}
                                    <Link to="/terms" target="_blank">Terms of Service</Link>
                                    {' '}and{' '}
                                    <Link to="/privacy" target="_blank">Privacy Policy</Link>
                                </span>
                            </label>
                            {errors.acceptTerms && (
                                <span className="error-message">{errors.acceptTerms.message}</span>
                            )}
                        </div>

                        <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
                            {isLoading ? 'Creating Account...' : 'Create Account'}
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
                            Already have an account?{' '}
                            <Link to="/login" className="auth-link">Sign In</Link>
                        </p>
                    </div>
                </div>

                <div className="auth-visual">
                    <div className="visual-content">
                        <h2>Join Our Expert Network</h2>
                        <p>Create your account and start connecting with clients today</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;
