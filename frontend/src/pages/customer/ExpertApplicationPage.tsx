import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { applicationApi, documentApi } from '../../services/api';
import { User, Phone, Calendar, MapPin, Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ExpertApplicationPage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [application, setApplication] = useState<any>(null);
    const [documents, setDocuments] = useState<any[]>([]);

    // Profile Form State
    const [profileData, setProfileData] = useState({
        phone: '',
        dob: '',
        address: ''
    });

    // Document Upload State
    const [docType, setDocType] = useState('government_id');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    useEffect(() => {
        fetchApplicationData();
    }, []);

    const fetchApplicationData = async () => {
        try {
            setLoading(true);
            const [appRes, docsRes] = await Promise.all([
                applicationApi.getMyApplication(),
                documentApi.getMyDocuments()
            ]);

            // Access .data from AxiosResponse, then .success from ApiResponse
            if (appRes.data.success && appRes.data.data) {
                setApplication(appRes.data.data.application);
                setProfileData({
                    phone: appRes.data.data.application.profile_phone || '',
                    dob: appRes.data.data.application.profile_dob || '',
                    address: appRes.data.data.application.profile_address || ''
                });
            }

            if (docsRes.data.success && docsRes.data.data) {
                setDocuments(docsRes.data.data.documents || []);
            }
        } catch (error) {
            console.error('Error fetching application data:', error);
            toast.error('Failed to load application data');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            const res = await applicationApi.saveDraft(profileData);
            if (res.data.success) {
                toast.success('Profile saved successfully');
            }
        } catch (error) {
            toast.error('Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) return;

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('type', docType);

            // We'll use a direct fetch or update documentApi to handle POML v1.0 path
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/expert_documents/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const res = await response.json();

            if (res.success) {
                toast.success('Document uploaded successfully');
                setSelectedFile(null);
                // Reset file input
                const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
                fetchApplicationData(); // Refresh list
            } else {
                toast.error(res.error || 'Upload failed');
            }
        } catch (error) {
            toast.error('Error uploading document');
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <header className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-900">Expert Application</h1>
                <p className="text-gray-600">Complete your profile and upload documents to become an expert.</p>
                {application?.status && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                        Status: {application.status.toUpperCase()}
                    </div>
                )}
            </header>

            {/* Profile Section */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                    <User className="text-blue-600 w-6 h-6" />
                    <h2 className="text-xl font-semibold">Profile Details</h2>
                </div>

                <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Phone className="w-4 h-4" /> Phone Number
                        </label>
                        <input
                            type="tel"
                            value={profileData.phone}
                            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="+1 234 567 8900"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Calendar className="w-4 h-4" /> Date of Birth
                        </label>
                        <input
                            type="date"
                            value={profileData.dob}
                            onChange={(e) => setProfileData({ ...profileData, dob: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            required
                        />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> Professional Address
                        </label>
                        <textarea
                            value={profileData.address}
                            onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all h-24"
                            placeholder="Enter your full business address..."
                            required
                        />
                    </div>

                    <div className="md:col-span-2 pt-2">
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-300 flex items-center gap-2 transition-colors"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            Save Profile
                        </button>
                    </div>
                </form>
            </section>

            {/* Documents Section */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                    <FileText className="text-blue-600 w-6 h-6" />
                    <h2 className="text-xl font-semibold">Documents</h2>
                </div>

                {/* Document List */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Uploaded Documents</h3>
                    {documents.length === 0 ? (
                        <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg text-gray-400">
                            No documents uploaded yet.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {documents.map((doc) => (
                                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-200 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{doc.file_name}</p>
                                            <p className="text-xs text-gray-500 capitalize">{doc.document_type.replace('_', ' ')} • {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <a
                                        href={doc.r2_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 rounded hover:bg-blue-50 transition-colors"
                                    >
                                        View
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Upload Form */}
                <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Upload New Document</h3>
                    <form onSubmit={handleFileUpload} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Document Type</label>
                                <select
                                    value={docType}
                                    onChange={(e) => setDocType(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="government_id">Government ID</option>
                                    <option value="profile">Profile Photo</option>
                                    <option value="resume">Resume/CV</option>
                                    <option value="certificate">Certification</option>
                                    <option value="portfolio">Portfolio Item</option>
                                    <option value="other">Other Document</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Select File</label>
                                <input
                                    id="file-upload"
                                    type="file"
                                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    required
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={uploading || !selectedFile}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-300 flex items-center gap-2 transition-colors mt-2"
                        >
                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            Upload Document
                        </button>
                    </form>
                </div>
            </section>

            {/* Submit Footer */}
            <footer className="bg-blue-50 border border-blue-100 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex gap-3">
                    <CheckCircle className="text-blue-600 w-6 h-6 flex-shrink-0" />
                    <p className="text-sm text-blue-800">
                        Once you have completed your profile and uploaded all necessary documents, submit your application for review.
                    </p>
                </div>
                <button
                    onClick={async () => {
                        try {
                            const res = await applicationApi.submitApplication();
                            if (res.data.success) {
                                toast.success('Application submitted successfully!');
                                fetchApplicationData();
                            }
                        } catch (error) {
                            toast.error('Failed to submit application');
                        }
                    }}
                    disabled={application?.status?.toLowerCase() === 'pending' || application?.status?.toLowerCase() === 'approved'}
                    className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:bg-blue-300 disabled:shadow-none transition-all whitespace-nowrap"
                >
                    Submit Application
                </button>
            </footer>
        </div>
    );
};

export default ExpertApplicationPage;
