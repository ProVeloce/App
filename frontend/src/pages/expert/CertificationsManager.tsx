import React from 'react';
import { Award, Plus } from 'lucide-react';

const CertificationsManager: React.FC = () => (
    <div className="page">
        <div className="page-header"><h1>Certifications</h1><p>Manage your professional certifications</p></div>
        <div className="empty-state">
            <Award size={48} />
            <h3>No Certifications</h3>
            <p>Add your certifications to build credibility</p>
            <button className="btn btn-primary"><Plus size={18} /> Add Certification</button>
        </div>
        <style>{`
      .page { animation: fadeIn 0.3s ease-out; }
      .page-header { margin-bottom: var(--space-6); }
      .page-header h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: var(--space-1); }
      .page-header p { color: var(--text-secondary); }
      .empty-state { background: var(--bg-primary); border-radius: var(--radius-xl); border: 1px solid var(--border-light); padding: var(--space-12); text-align: center; color: var(--text-muted); }
      .empty-state svg { margin-bottom: var(--space-4); opacity: 0.5; }
      .empty-state h3 { color: var(--text-secondary); margin-bottom: var(--space-2); }
      .empty-state p { margin-bottom: var(--space-6); }
    `}</style>
    </div>
);

export default CertificationsManager;
