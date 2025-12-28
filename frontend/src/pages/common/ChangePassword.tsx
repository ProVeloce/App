import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Lock, Eye, EyeOff, Check, Save } from 'lucide-react';
import '../auth/AuthPages.css';

const passwordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
        .string()
        .min(8, 'At least 8 characters')
        .regex(/[A-Z]/, 'One uppercase letter')
        .regex(/[a-z]/, 'One lowercase letter')
        .regex(/[0-9]/, 'One number')
        .regex(/[!@#$%^&*(),.?":{}|<>]/, 'One special character'),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

type PasswordForm = z.infer<typeof passwordSchema>;

const ChangePassword: React.FC = () => {
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { success, error } = useToast();

    const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<PasswordForm>({
        resolver: zodResolver(passwordSchema),
    });

    const newPassword = watch('newPassword', '');

    const criteria = [
        { met: newPassword.length >= 8, label: 'At least 8 characters' },
        { met: /[A-Z]/.test(newPassword), label: 'One uppercase letter' },
        { met: /[a-z]/.test(newPassword), label: 'One lowercase letter' },
        { met: /[0-9]/.test(newPassword), label: 'One number' },
        { met: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword), label: 'One special character' },
    ];

    const onSubmit = async (data: PasswordForm) => {
        setIsLoading(true);
        try {
            await authApi.changePassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
                confirmPassword: data.confirmPassword,
            });
            success('Password changed successfully');
            reset();
        } catch (err: any) {
            error(err.response?.data?.error || 'Failed to change password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="change-password-page">
            <div className="page-header">
                <h1>Change Password</h1>
                <p>Update your account password</p>
            </div>

            <div className="password-form-container">
                <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
                    <div className="form-group">
                        <label>Current Password</label>
                        <div className="input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input
                                type={showCurrent ? 'text' : 'password'}
                                placeholder="Enter current password"
                                {...register('currentPassword')}
                            />
                            <button type="button" className="toggle-password" onClick={() => setShowCurrent(!showCurrent)}>
                                {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {errors.currentPassword && <span className="error-message">{errors.currentPassword.message}</span>}
                    </div>

                    <div className="form-group">
                        <label>New Password</label>
                        <div className="input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input
                                type={showNew ? 'text' : 'password'}
                                placeholder="Enter new password"
                                {...register('newPassword')}
                            />
                            <button type="button" className="toggle-password" onClick={() => setShowNew(!showNew)}>
                                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <div className="password-criteria">
                            {criteria.map((c, i) => (
                                <div key={i} className={`criterion ${c.met ? 'met' : ''}`}>
                                    <Check size={14} />
                                    <span>{c.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Confirm New Password</label>
                        <div className="input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input
                                type="password"
                                placeholder="Confirm new password"
                                {...register('confirmPassword')}
                            />
                        </div>
                        {errors.confirmPassword && <span className="error-message">{errors.confirmPassword.message}</span>}
                    </div>

                    <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
                        {isLoading ? 'Changing...' : 'Change Password'}
                        <Save size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChangePassword;
