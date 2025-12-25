import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Clock, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

const ExpertApplication: React.FC = () => {
    return (
        <div className="page">
            <div className="page-header">
                <h1>Apply as Expert</h1>
                <p>Share your expertise and start earning on ProVeloce</p>
            </div>

            <div className="application-intro">
                <div className="intro-card">
                    <h2>Become a ProVeloce Expert</h2>
                    <p>Join our network of verified professionals and connect with clients worldwide.</p>

                    <div className="benefits-grid">
                        <div className="benefit">
                            <CheckCircle size={24} />
                            <div>
                                <h4>Verified Badge</h4>
                                <p>Get a verified expert badge after approval</p>
                            </div>
                        </div>
                        <div className="benefit">
                            <Clock size={24} />
                            <div>
                                <h4>Flexible Schedule</h4>
                                <p>Work on your own terms and time</p>
                            </div>
                        </div>
                        <div className="benefit">
                            <FileText size={24} />
                            <div>
                                <h4>Quality Projects</h4>
                                <p>Access to curated project opportunities</p>
                            </div>
                        </div>
                    </div>

                    <div className="application-cta">
                        <p>Application form coming soon. Please check back later.</p>
                        <Link to="/customer/application-status" className="btn btn-primary">
                            Check Application Status <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            </div>

            <style>{`
        .page { animation: fadeIn 0.3s ease-out; }
        .page-header { margin-bottom: var(--space-6); }
        .page-header h1 { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin-bottom: var(--space-1); }
        .page-header p { color: var(--text-secondary); }
        .intro-card { background: var(--bg-primary); border-radius: var(--radius-xl); border: 1px solid var(--border-light); padding: var(--space-8); }
        .intro-card h2 { font-size: 1.25rem; font-weight: 600; margin-bottom: var(--space-2); }
        .intro-card > p { color: var(--text-secondary); margin-bottom: var(--space-6); }
        .benefits-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4); margin-bottom: var(--space-8); }
        .benefit { display: flex; gap: var(--space-3); padding: var(--space-4); background: var(--bg-secondary); border-radius: var(--radius-lg); }
        .benefit svg { color: var(--primary-600); flex-shrink: 0; }
        .benefit h4 { font-weight: 600; color: var(--text-primary); margin-bottom: 4px; }
        .benefit p { font-size: 0.875rem; color: var(--text-muted); }
        .application-cta { text-align: center; padding-top: var(--space-6); border-top: 1px solid var(--border-light); }
        .application-cta p { margin-bottom: var(--space-4); color: var(--text-muted); }
        @media (max-width: 768px) { .benefits-grid { grid-template-columns: 1fr; } }
      `}</style>
        </div>
    );
};

export default ExpertApplication;
