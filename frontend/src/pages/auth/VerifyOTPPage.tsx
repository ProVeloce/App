import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Lock, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import './AuthPages.css';

const resetPasswordSchema = z.object({
    newPassword: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Must contain at least one number')
        .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Must contain at least one special character'),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

const VerifyOTPPage: React.FC = () => {
    const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const [otpError, setOtpError] = useState('');
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const { error, success } = useToast();
    const navigate = useNavigate();
    const location = useLocation();

    const { email, type } = (location.state as { email: string; type: string }) || {};

    useEffect(() => {
        if (!email) {
            navigate('/login');
        }
    }, [email, navigate]);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [countdown]);

    const resetForm = useForm<ResetPasswordForm>({
        resolver: zodResolver(resetPasswordSchema),
    });

    const handleOtpChange = (index: number, value: string) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setOtpError('');

        // Move to next input if value entered
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        // Move to previous input on backspace if current is empty
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pastedData.length === 6) {
            const newOtp = pastedData.split('');
            setOtp(newOtp);
            inputRefs.current[5]?.focus();
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        const otpString = otp.join('');

        if (otpString.length !== 6) {
            setOtpError('Please enter all 6 digits');
            return;
        }

        setIsLoading(true);
        try {
            const response = await authApi.verifyOTP({ email, otp: otpString, type });

            if (response.data.success) {
                if (type === 'password_reset') {
                    setOtpVerified(true);
                    success('OTP verified. Set your new password.');
                } else {
                    success('Email verified successfully!');
                    navigate('/login');
                }
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || 'Invalid or expired OTP';
            setOtpError(errorMsg);
            error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (data: ResetPasswordForm) => {
        setIsLoading(true);
        try {
            const response = await authApi.resetPassword({
                email,
                otp: otp.join(''),
                newPassword: data.newPassword,
            });

            if (response.data.success) {
                success('Password reset successful! Please login.');
                navigate('/login');
            }
        } catch (err: any) {
            error(err.response?.data?.error || 'Failed to reset password');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOTP = async () => {
        try {
            await authApi.resendOTP({ email, type });
            success('New OTP sent to your email');
            setCountdown(60);
            setCanResend(false);
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } catch (err) {
            error('Failed to resend OTP');
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <Link to="/" className="auth-logo">ProVeloce Connect</Link>
                        <h1>{otpVerified ? 'Reset Password' : 'Verify OTP'}</h1>
                        <p>
                            {otpVerified
                                ? 'Enter your new password'
                                : `Enter the 6-digit code sent to ${email}`}
                        </p>
                    </div>

                    {!otpVerified ? (
                        <form onSubmit={handleVerifyOTP} className="auth-form">
                            <div className="form-group">
                                <label>Enter OTP</label>
                                <div className="otp-boxes" onPaste={handlePaste}>
                                    {otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(el) => (inputRefs.current[index] = el)}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(index, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(index, e)}
                                            className={`otp-box ${otpError ? 'error' : ''}`}
                                            autoFocus={index === 0}
                                        />
                                    ))}
                                </div>
                                {otpError && <span className="error-message">{otpError}</span>}
                            </div>

                            <div className="resend-section">
                                {canResend ? (
                                    <button type="button" onClick={handleResendOTP} className="resend-btn">
                                        Resend OTP
                                    </button>
                                ) : (
                                    <span className="countdown">Resend in {countdown}s</span>
                                )}
                            </div>

                            <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
                                {isLoading ? 'Verifying...' : 'Verify OTP'}
                                {!isLoading && <ArrowRight size={18} />}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={resetForm.handleSubmit(handleResetPassword)} className="auth-form">
                            <div className="form-group">
                                <label htmlFor="newPassword">New Password</label>
                                <div className="input-wrapper">
                                    <Lock size={18} className="input-icon" />
                                    <input
                                        id="newPassword"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter new password"
                                        {...resetForm.register('newPassword')}
                                        className={resetForm.formState.errors.newPassword ? 'error' : ''}
                                    />
                                    <button
                                        type="button"
                                        className="toggle-password"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {resetForm.formState.errors.newPassword && (
                                    <span className="error-message">{resetForm.formState.errors.newPassword.message}</span>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword">Confirm Password</label>
                                <div className="input-wrapper">
                                    <Lock size={18} className="input-icon" />
                                    <input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="Confirm new password"
                                        {...resetForm.register('confirmPassword')}
                                        className={resetForm.formState.errors.confirmPassword ? 'error' : ''}
                                    />
                                </div>
                                {resetForm.formState.errors.confirmPassword && (
                                    <span className="error-message">{resetForm.formState.errors.confirmPassword.message}</span>
                                )}
                            </div>

                            <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
                                {isLoading ? 'Resetting...' : 'Reset Password'}
                                {!isLoading && <ArrowRight size={18} />}
                            </button>
                        </form>
                    )}

                    <div className="auth-footer">
                        <Link to="/login" className="back-link">
                            <ArrowLeft size={16} /> Back to Login
                        </Link>
                    </div>
                </div>

                <div className="auth-visual">
                    <div className="visual-content">
                        <h2>Almost There!</h2>
                        <p>Complete verification to continue</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyOTPPage;
