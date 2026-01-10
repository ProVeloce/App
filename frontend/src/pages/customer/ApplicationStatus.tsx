import React, { useEffect, useState } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, FileText, Loader } from 'lucide-react';
import { applicationApi } from '../../services/api';
import { Link } from 'react-router-dom';

interface ApplicationData {
    id: string;
    status: string;
    submittedAt?: string;
    createdAt?: string;
    updatedAt?: string;
    rejectionReason?: string;
}

const ApplicationStatus: React.FC = () => {
    const [application, setApplication] = useState<ApplicationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchApplicationStatus = async () => {
            try {
                setLoading(true);
                const response = await applicationApi.getMyApplication();
                console.log('📋 Application status API response:', response.data);

                if (response.data.success && response.data.data?.application) {
                    setApplication(response.data.data.application);
                } else {
                    setApplication(null);
                }
            } catch (err: any) {
                console.error('Error fetching application:', err);
                // 404 means no application exists
                if (err.response?.status === 404) {
                    setApplication(null);
                } else {
                    setError(err.message || 'Failed to fetch application status');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchApplicationStatus();
    }, []);

    const getStatusConfig = (status: string | undefined) => {
        const normalizedStatus = (status || 'NONE').toUpperCase();

        switch (normalizedStatus) {
            case 'DRAFT':
                return {
                    icon: <FileText size={48} />,
                    title: 'Draft Saved',
                    description: 'Your application is saved as a draft. Continue to complete and submit.',
                    iconClass: 'draft',
                    action: (
                        <Link to="/customer/apply-expert" className="btn btn-primary">
                            Continue Application
                        </Link>
                    )
                };
            case 'PENDING':
                return {
                    icon: <AlertCircle size={48} />,
                    title: 'Application Under Review',
                    description: 'Your application has been submitted and is pending review by our team. We\'ll notify you once a decision is made.',
                    iconClass: 'pending',
                    action: null
                };
            case 'APPROVED':
                return {
                    icon: <CheckCircle size={48} />,
                    title: 'Congratulations! You\'re an Expert',
                    description: 'Your application has been approved. Welcome to the ProVeloce Expert Network!',
                    iconClass: 'approved',
                    action: (
                        <Link to="/expert/dashboard" className="btn btn-primary">
                            Go to Expert Dashboard
                        </Link>
                    )
                };
            case 'REJECTED':
                return {
                    icon: <XCircle size={48} />,
                    title: 'Application Not Approved',
                    description: application?.rejectionReason || 'Unfortunately, your application was not approved at this time. You may reapply with updated information.',
                    iconClass: 'rejected',
                    action: (
                        <Link to="/customer/apply-expert" className="btn btn-primary">
                            Reapply
                        </Link>
                    )
                };
            case 'REVOKED':
                return {
                    icon: <XCircle size={48} />,
                    title: 'Expert Access Revoked',
                    description: application?.rejectionReason || 'Your expert account has been disabled by ProVeloce. If you believe this is an error, please contact support.',
                    iconClass: 'revoked',
                    action: null
                };
            default:
                return {
                    icon: <Clock size={48} />,
                    title: 'No Application Found',
                    description: 'You haven\'t started an expert application yet.',
                    iconClass: 'none',
                    action: (
                        <Link to="/customer/apply-expert" className="btn btn-primary">
                            Apply Now
                        </Link>
                    )
                };
        }
    };

    if (loading) {
        return (
            <div className="page">
                <div className="page-header">
                    <h1>Application Status</h1>
                    <p>Track your expert application progress</p>
                </div>
                <div className="status-card loading-card">
                    <Loader size={48} className="spinner" />
                    <h2>Loading your application...</h2>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page">
                <div className="page-header">
                    <h1>Application Status</h1>
                    <p>Track your expert application progress</p>
                </div>
                <div className="status-card error-card">
                    <XCircle size={48} />
                    <h2>Error Loading Status</h2>
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()} className="btn btn-primary">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const statusConfig = getStatusConfig(application?.status);

    return (
        <div className="page">
            <div className="page-header">
                <h1>Application Status</h1>
                <p>Track your expert application progress</p>
            </div>

            <div className="status-card">
                <div className={`status-icon ${statusConfig.iconClass}`}>
                    {statusConfig.icon}
                </div>
                <h2>{statusConfig.title}</h2>
                <p>{statusConfig.description}</p>

                {application?.submittedAt && (
                    <p className="submitted-date">
                        Submitted: {new Date(application.submittedAt).toLocaleDateString()}
                    </p>
                )}

                {statusConfig.action}
            </div>

            <div className="status-legend">
                <h3>Application Status Guide</h3>
                <div className="legend-grid">
                    <div className="legend-item">
                        <div className="legend-icon draft"><FileText size={20} /></div>
                        <div>
                            <span className="legend-title">Draft</span>
                            <span className="legend-desc">Application saved but not submitted</span>
                        </div>
                    </div>
                    <div className="legend-item">
                        <div className="legend-icon pending"><AlertCircle size={20} /></div>
                        <div>
                            <span className="legend-title">Pending Review</span>
                            <span className="legend-desc">Submitted and awaiting review</span>
                        </div>
                    </div>
                    <div className="legend-item">
                        <div className="legend-icon approved"><CheckCircle size={20} /></div>
                        <div>
                            <span className="legend-title">Approved</span>
                            <span className="legend-desc">Congratulations! You're an expert</span>
                        </div>
                    </div>
                    <div className="legend-item">
                        <div className="legend-icon rejected"><XCircle size={20} /></div>
                        <div>
                            <span className="legend-title">Rejected</span>
                            <span className="legend-desc">Application not approved</span>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        .page { animation: fadeIn 0.3s ease-out; }
        .page-header { margin-bottom: var(--space-6); }
        .page-header h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: var(--space-1); }
        .page-header p { color: var(--text-secondary); }
        .status-card { background: var(--bg-primary); border-radius: var(--radius-xl); border: 1px solid var(--border-light); padding: var(--space-12); text-align: center; margin-bottom: var(--space-6); }
        .status-card.loading-card { display: flex; flex-direction: column; align-items: center; gap: var(--space-4); }
        .spinner { animation: spin 1s linear infinite; color: var(--primary-500); }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .status-icon { width: 80px; height: 80px; border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-4); }
        .status-icon.none { background: var(--gray-100); color: var(--gray-500); }
        .status-icon.draft { background: var(--gray-100); color: var(--gray-600); }
        .status-icon.pending { background: var(--warning-50); color: var(--warning-600); }
        .status-icon.approved { background: var(--success-50); color: var(--success-600); }
        .status-icon.rejected { background: var(--error-50); color: var(--error-500); }
        .status-icon.revoked { background: var(--gray-800); color: var(--gray-200); }
        .status-card h2 { font-size: 1.25rem; font-weight: 600; margin-bottom: var(--space-2); }
        .status-card p { color: var(--text-muted); margin-bottom: var(--space-6); max-width: 500px; margin-left: auto; margin-right: auto; }
        .submitted-date { font-size: 0.875rem; color: var(--text-secondary); margin-top: var(--space-2); }
        .status-legend { background: var(--bg-primary); border-radius: var(--radius-xl); border: 1px solid var(--border-light); padding: var(--space-6); }
        .status-legend h3 { font-size: 1rem; font-weight: 600; margin-bottom: var(--space-4); }
        .legend-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-4); }
        .legend-item { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3); background: var(--bg-secondary); border-radius: var(--radius-lg); }
        .legend-icon { width: 40px; height: 40px; border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; }
        .legend-icon.draft { background: var(--gray-100); color: var(--gray-500); }
        .legend-icon.pending { background: var(--warning-50); color: var(--warning-600); }
        .legend-icon.approved { background: var(--success-50); color: var(--success-600); }
        .legend-icon.rejected { background: var(--error-50); color: var(--error-500); }
        .legend-title { display: block; font-weight: 500; color: var(--text-primary); }
        .legend-desc { font-size: 0.75rem; color: var(--text-muted); }
        @media (max-width: 768px) { .legend-grid { grid-template-columns: 1fr; } }
      `}</style>
        </div>
    );
};

export default ApplicationStatus;
