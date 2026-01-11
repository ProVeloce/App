import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import ConfirmModal from '../../components/common/ConfirmModal';
import {
    Award,
    Plus,
    X,
    Upload,
    Calendar,
    Building2,
    ExternalLink,
    Trash2,
    Eye,
    Download,
    Loader2,
    FileText,
    Image,
} from 'lucide-react';
import './CertificationsManager.css';

interface Certification {
    id: string;
    title: string;
    issuer: string;
    credentialId?: string;
    credentialUrl?: string;
    issueDate: string;
    expiryDate?: string;
    fileName: string;
    fileUrl: string;
    createdAt: string;
}

const CertificationsManager: React.FC = () => {
    const { user } = useAuth();
    const [certifications, setCertifications] = useState<Certification[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string | null }>({
        show: false,
        id: null,
    });
    const [deleting, setDeleting] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [issuer, setIssuer] = useState('');
    const [credentialId, setCredentialId] = useState('');
    const [credentialUrl, setCredentialUrl] = useState('');
    const [issueDate, setIssueDate] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchCertifications();
    }, []);

    const fetchCertifications = async () => {
        try {
            // TODO: Fetch from GET /api/expert/certifications
            // For now, using empty array
            setCertifications([]);
        } catch (error) {
            console.error('Error fetching certifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            // Validate file type
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(selectedFile.type)) {
                alert('Please upload a PDF or image file');
                return;
            }
            // Validate file size (10MB max)
            if (selectedFile.size > 10 * 1024 * 1024) {
                alert('File size must be less than 10MB');
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !issuer.trim() || !issueDate) return;

        setSubmitting(true);
        try {
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('title', title);
            formData.append('issuer', issuer);
            formData.append('issueDate', issueDate);
            if (credentialId) formData.append('credentialId', credentialId);
            if (credentialUrl) formData.append('credentialUrl', credentialUrl);
            if (expiryDate) formData.append('expiryDate', expiryDate);
            if (file) formData.append('file', file);

            // TODO: Post to POST /api/expert/certifications
            // This will upload file to expertdetails bucket and save metadata
            console.log('Submitting certification:', { title, issuer, issueDate, file: file?.name });

            // Reset form and close modal
            resetForm();
            setShowAddModal(false);
            fetchCertifications();
        } catch (error) {
            console.error('Error creating certification:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm.id) return;

        setDeleting(true);
        try {
            // TODO: Delete via DELETE /api/expert/certifications/:id
            // This will delete from R2 bucket and database
            console.log('Deleting certification:', deleteConfirm.id);

            // Remove from local state
            setCertifications(prev => prev.filter(c => c.id !== deleteConfirm.id));
            setDeleteConfirm({ show: false, id: null });
        } catch (error) {
            console.error('Error deleting certification:', error);
        } finally {
            setDeleting(false);
        }
    };

    const resetForm = () => {
        setTitle('');
        setIssuer('');
        setCredentialId('');
        setCredentialUrl('');
        setIssueDate('');
        setExpiryDate('');
        setFile(null);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getFileIcon = (fileName: string) => {
        if (fileName.toLowerCase().endsWith('.pdf')) return <FileText size={16} />;
        return <Image size={16} />;
    };

    if (loading) {
        return (
            <div className="certifications-page loading">
                <Loader2 size={32} className="spin" />
                <p>Loading certifications...</p>
            </div>
        );
    }

    return (
        <div className="certifications-page">
            <div className="page-header">
                <div>
                    <h1>Certifications</h1>
                    <p>Manage your professional certifications</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                    <Plus size={18} />
                    Add Certification
                </button>
            </div>

            {certifications.length === 0 ? (
                <div className="empty-state">
                    <Award size={48} />
                    <h3>No Certifications</h3>
                    <p>Add your certifications to build credibility</p>
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                        <Plus size={18} />
                        Add Certification
                    </button>
                </div>
            ) : (
                <div className="certifications-grid">
                    {certifications.map((cert) => (
                        <div key={cert.id} className="certification-card">
                            <div className="card-icon">
                                <Award size={24} />
                            </div>
                            <div className="card-content">
                                <h3>{cert.title}</h3>
                                <div className="card-meta">
                                    <span className="issuer">
                                        <Building2 size={14} />
                                        {cert.issuer}
                                    </span>
                                    <span className="date">
                                        <Calendar size={14} />
                                        {formatDate(cert.issueDate)}
                                        {cert.expiryDate && ` - ${formatDate(cert.expiryDate)}`}
                                    </span>
                                </div>
                                {cert.credentialId && (
                                    <p className="credential-id">ID: {cert.credentialId}</p>
                                )}
                            </div>
                            <div className="card-actions">
                                {cert.credentialUrl && (
                                    <a
                                        href={cert.credentialUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-icon"
                                        title="View Credential"
                                    >
                                        <ExternalLink size={16} />
                                    </a>
                                )}
                                <a
                                    href={cert.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-icon"
                                    title="View Document"
                                >
                                    <Eye size={16} />
                                </a>
                                <a
                                    href={cert.fileUrl}
                                    download={cert.fileName}
                                    className="btn-icon"
                                    title="Download"
                                >
                                    <Download size={16} />
                                </a>
                                <button
                                    className="btn-icon danger"
                                    title="Delete"
                                    onClick={() => setDeleteConfirm({ show: true, id: cert.id })}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Certification Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add Certification</h2>
                            <button className="btn-close" onClick={() => setShowAddModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-body">
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="title">Certification Title *</label>
                                    <input
                                        id="title"
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g., Google Data Analytics"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="issuer">Issuing Organization *</label>
                                    <input
                                        id="issuer"
                                        type="text"
                                        value={issuer}
                                        onChange={(e) => setIssuer(e.target.value)}
                                        placeholder="e.g., Google, Coursera"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="credentialId">Credential ID</label>
                                    <input
                                        id="credentialId"
                                        type="text"
                                        value={credentialId}
                                        onChange={(e) => setCredentialId(e.target.value)}
                                        placeholder="Optional"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="credentialUrl">Credential URL</label>
                                    <input
                                        id="credentialUrl"
                                        type="url"
                                        value={credentialUrl}
                                        onChange={(e) => setCredentialUrl(e.target.value)}
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="issueDate">Issue Date *</label>
                                    <input
                                        id="issueDate"
                                        type="date"
                                        value={issueDate}
                                        onChange={(e) => setIssueDate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="expiryDate">Expiry Date</label>
                                    <input
                                        id="expiryDate"
                                        type="date"
                                        value={expiryDate}
                                        onChange={(e) => setExpiryDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Upload Certificate Document</label>
                                <div
                                    className={`file-upload-zone ${file ? 'has-file' : ''}`}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {file ? (
                                        <div className="selected-file">
                                            {getFileIcon(file.name)}
                                            <span className="file-name">{file.name}</span>
                                            <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                                            <button
                                                type="button"
                                                className="btn-remove"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setFile(null);
                                                }}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload size={24} />
                                            <p>Click to upload PDF or image</p>
                                            <span>Max 10MB</span>
                                        </>
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,image/jpeg,image/png,image/webp"
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                />
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={submitting || !title.trim() || !issuer.trim() || !issueDate}
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 size={18} className="spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Plus size={18} />
                                            Add Certification
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteConfirm.show}
                title="Delete Certification"
                message="Are you sure you want to delete this certification? This action cannot be undone."
                confirmText={deleting ? 'Deleting...' : 'Delete'}
                cancelText="Cancel"
                onConfirm={handleDelete}
                onCancel={() => setDeleteConfirm({ show: false, id: null })}
                variant="danger"
            />
        </div>
    );
};

export default CertificationsManager;
