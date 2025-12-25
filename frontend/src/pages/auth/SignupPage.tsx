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
                        <Link to="/" className="auth-logo">ProVeloce</Link>
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
