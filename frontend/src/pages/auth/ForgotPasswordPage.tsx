import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import './AuthPages.css';

const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const { error, success } = useToast();
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        getValues,
        formState: { errors },
    } = useForm<ForgotPasswordForm>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordForm) => {
        setIsLoading(true);
        try {
            await authApi.forgotPassword({ email: data.email });
            success('If an account exists, an OTP has been sent');
            setEmailSent(true);
        } catch (err) {
            error('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleContinue = () => {
        navigate('/verify-otp', {
            state: { email: getValues('email'), type: 'password_reset' }
        });
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <AppLogo showText={true} size="large" className="auth-logo" />
                        <h1>Forgot Password</h1>
                        <p>
                            {emailSent
                                ? 'Check your email for the OTP'
                                : "Enter your email and we'll send you an OTP to reset your password"}
                        </p>
                    </div>

                    {!emailSent ? (
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

                            <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
                                {isLoading ? 'Sending...' : 'Send OTP'}
                                {!isLoading && <ArrowRight size={18} />}
                            </button>
                        </form>
                    ) : (
                        <div className="success-message">
                            <div className="success-icon">✓</div>
                            <p>An OTP has been sent to your email address. Click continue to verify.</p>
                            <button onClick={handleContinue} className="btn btn-primary btn-block">
                                Continue to Verify <ArrowRight size={18} />
                            </button>
                        </div>
                    )}

                    <div className="auth-footer">
                        <Link to="/login" className="back-link">
                            <ArrowLeft size={16} /> Back to Login
                        </Link>
                    </div>
                </div>

                <div className="auth-visual">
                    <div className="visual-content">
                        <h2>Reset Your Password</h2>
                        <p>We'll help you get back into your account</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
