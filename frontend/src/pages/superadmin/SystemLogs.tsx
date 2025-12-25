import React from 'react';
import { FileText, Download, RefreshCw } from 'lucide-react';

const SystemLogs: React.FC = () => (
    <div className="page">
        <div className="page-header">
            <div><h1>System Logs</h1><p>Audit logs and activity monitoring</p></div>
            <div className="actions">
                <button className="btn btn-ghost"><RefreshCw size={18} /> Refresh</button>
                <button className="btn btn-ghost"><Download size={18} /> Export</button>
            </div>
        </div>
        <div className="empty-state"><FileText size={48} /><h3>No Logs Available</h3><p>System activity logs will appear here</p></div>
        <style>{`
      .page { animation: fadeIn 0.3s ease-out; }
      .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-6); }
      .page-header h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: var(--space-1); }
      .page-header p { color: var(--text-secondary); }
      .actions { display: flex; gap: var(--space-2); }
      .empty-state { background: var(--bg-primary); border-radius: var(--radius-xl); border: 1px solid var(--border-light); padding: var(--space-12); text-align: center; color: var(--text-muted); }
      .empty-state svg { margin-bottom: var(--space-4); opacity: 0.5; }
      .empty-state h3 { color: var(--text-secondary); margin-bottom: var(--space-2); }
    `}</style>
    </div>
);

export default SystemLogs;
