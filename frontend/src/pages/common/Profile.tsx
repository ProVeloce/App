import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { profileApi, activityApi } from '../../services/api';
import { User, Mail, Phone, MapPin, Calendar, Camera, Save, Clock } from 'lucide-react';
import './Profile.css';

const profileSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().optional(),
    dob: z.string().optional(),
    gender: z.string().optional(),
    addressLine1: z.string().optional(),
    addressLine2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    pincode: z.string().optional(),
    bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

const Profile: React.FC = () => {
    const { user, refreshUser } = useAuth();
    const { success, error } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profileData, setProfileData] = useState<any>(null);
    const [completion, setCompletion] = useState(0);
    const [loginHistory, setLoginHistory] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

    const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema),
    });

    useEffect(() => {
        fetchProfile();
        fetchLoginHistory();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await profileApi.getMyProfile();
            if (response.data.success && response.data.data) {
                const { user: userData, profileCompletion } = response.data.data;
                setProfileData(userData);
                setCompletion(profileCompletion);
                reset({
                    name: userData.name,
                    phone: userData.phone || '',
                    dob: userData.profile?.dob?.split('T')[0] || '',
                    gender: userData.profile?.gender || '',
                    addressLine1: userData.profile?.addressLine1 || '',
                    addressLine2: userData.profile?.addressLine2 || '',
                    city: userData.profile?.city || '',
                    state: userData.profile?.state || '',
                    country: userData.profile?.country || '',
                    pincode: userData.profile?.pincode || '',
                    bio: userData.profile?.bio || '',
                });
            }
        } catch (err) {
            error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const fetchLoginHistory = async () => {
        try {
            const response = await activityApi.getLoginHistory();
            if (response.data.success && response.data.data) {
                setLoginHistory(response.data.data.history || []);
            }
        } catch (err) {
            // Ignore
        }
    };

    const onSubmit = async (data: ProfileForm) => {
        setSaving(true);
        try {
            await profileApi.updateMyProfile(data);
            success('Profile updated successfully');
            await refreshUser();
            await fetchProfile();
        } catch (err) {
            error('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            error('Image must be less than 5MB');
            return;
        }

        try {
            await profileApi.updateAvatar(file);
            success('Avatar updated successfully');
            await fetchProfile();
        } catch (err) {
            error('Failed to update avatar');
        }
    };

    if (loading) {
        return (
            <div className="profile-loading">
                <div className="loading-spinner" />
            </div>
        );
    }

    return (
        <div className="profile-page">
            <div className="profile-header">
                <h1>My Profile</h1>
                <p>Manage your personal information and account settings</p>
            </div>

            <div className="profile-content">
                {/* Profile Card */}
                <div className="profile-sidebar">
                    <div className="profile-card">
                        <div className="avatar-section">
                            <div className="avatar-wrapper">
                                {profileData?.profile?.avatarUrl ? (
                                    <img
                                        src={profileData.profile.avatarUrl}
                                        alt={profileData.name}
                                        onError={(e) => {
                                            // Hide the broken image and show fallback
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            const fallback = document.createElement('span');
                                            fallback.textContent = profileData?.name?.charAt(0).toUpperCase() || '?';
                                            (e.target as HTMLImageElement).parentElement?.appendChild(fallback);
                                        }}
                                    />
                                ) : (
                                    <span>{profileData?.name?.charAt(0).toUpperCase()}</span>
                                )}
                                <label className="avatar-upload">
                                    <Camera size={16} />
                                    <input type="file" accept="image/*" onChange={handleAvatarChange} />
                                </label>
                            </div>
                            <h2>{profileData?.name}</h2>
                            <span className="role-badge">{user?.role}</span>
                        </div>

                        <div className="profile-completion">
                            <div className="completion-header">
                                <span>Profile Completion</span>
                                <span>{completion}%</span>
                            </div>
                            <div className="completion-bar">
                                <div className="completion-progress" style={{ width: `${completion}%` }} />
                            </div>
                        </div>

                        <div className="profile-info-quick">
                            <div className="info-item">
                                <Mail size={16} />
                                <span>{profileData?.email}</span>
                            </div>
                            {profileData?.phone && (
                                <div className="info-item">
                                    <Phone size={16} />
                                    <span>{profileData.phone}</span>
                                </div>
                            )}
                            <div className="info-item">
                                <Calendar size={16} />
                                <span>Joined {new Date(profileData?.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Section */}
                <div className="profile-main">
                    <div className="tab-header">
                        <button
                            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                            onClick={() => setActiveTab('profile')}
                        >
                            Profile Details
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
                            onClick={() => setActiveTab('security')}
                        >
                            Security
                        </button>
                    </div>

                    {activeTab === 'profile' && (
                        <form onSubmit={handleSubmit(onSubmit)} className="profile-form">
                            <div className="form-section">
                                <h3>Personal Information</h3>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Full Name *</label>
                                        <input type="text" {...register('name')} />
                                        {errors.name && <span className="error">{errors.name.message}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label>Phone Number</label>
                                        <input type="tel" {...register('phone')} />
                                    </div>
                                    <div className="form-group">
                                        <label>Date of Birth</label>
                                        <input type="date" {...register('dob')} />
                                    </div>
                                    <div className="form-group">
                                        <label>Gender</label>
                                        <select {...register('gender')}>
                                            <option value="">Select</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                            <option value="prefer_not_to_say">Prefer not to say</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="form-section">
                                <h3>Address</h3>
                                <div className="form-grid">
                                    <div className="form-group full-width">
                                        <label>Address Line 1</label>
                                        <input type="text" {...register('addressLine1')} />
                                    </div>
                                    <div className="form-group full-width">
                                        <label>Address Line 2</label>
                                        <input type="text" {...register('addressLine2')} />
                                    </div>
                                    <div className="form-group">
                                        <label>City</label>
                                        <input type="text" {...register('city')} />
                                    </div>
                                    <div className="form-group">
                                        <label>State</label>
                                        <input type="text" {...register('state')} />
                                    </div>
                                    <div className="form-group">
                                        <label>Country</label>
                                        <input type="text" {...register('country')} />
                                    </div>
                                    <div className="form-group">
                                        <label>Pincode</label>
                                        <input type="text" {...register('pincode')} />
                                    </div>
                                </div>
                            </div>

                            <div className="form-section">
                                <h3>About</h3>
                                <div className="form-group full-width">
                                    <label>Bio</label>
                                    <textarea {...register('bio')} rows={4} placeholder="Tell us about yourself..." />
                                    {errors.bio && <span className="error">{errors.bio.message}</span>}
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary" disabled={saving || !isDirty}>
                                    {saving ? 'Saving...' : 'Save Changes'}
                                    <Save size={18} />
                                </button>
                            </div>
                        </form>
                    )}

                    {activeTab === 'security' && (
                        <div className="security-section">
                            <div className="form-section">
                                <h3>Login History</h3>
                                <div className="login-history">
                                    {loginHistory.length > 0 ? (
                                        loginHistory.map((entry, index) => (
                                            <div key={index} className="history-item">
                                                <div className="history-icon">
                                                    <Clock size={16} />
                                                </div>
                                                <div className="history-details">
                                                    <span className="history-time">
                                                        {new Date(entry.createdAt).toLocaleString()}
                                                    </span>
                                                    <span className="history-info">
                                                        {entry.device || 'Unknown device'} • {entry.ipAddress || 'Unknown IP'}
                                                    </span>
                                                </div>
                                                <span className={`history-status ${entry.success ? 'success' : 'failed'}`}>
                                                    {entry.success ? 'Success' : 'Failed'}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="no-history">No login history available</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
