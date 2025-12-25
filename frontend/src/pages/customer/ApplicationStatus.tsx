import React from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const ApplicationStatus: React.FC = () => {
    return (
        <div className="page">
            <div className="page-header">
                <h1>Application Status</h1>
                <p>Track your expert application progress</p>
            </div>

            <div className="status-card">
                <div className="status-icon pending">
                    <Clock size={48} />
                </div>
                <h2>No Application Found</h2>
                <p>You haven't submitted an expert application yet.</p>
                <a href="/customer/apply-expert" className="btn btn-primary">
                    Apply Now
                </a>
            </div>

            <div className="status-legend">
                <h3>Application Status Guide</h3>
                <div className="legend-grid">
                    <div className="legend-item">
                        <div className="legend-icon draft"><Clock size={20} /></div>
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
        .status-icon { width: 80px; height: 80px; border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-4); }
        .status-icon.pending { background: var(--warning-50); color: var(--warning-600); }
        .status-card h2 { font-size: 1.25rem; font-weight: 600; margin-bottom: var(--space-2); }
        .status-card p { color: var(--text-muted); margin-bottom: var(--space-6); }
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
