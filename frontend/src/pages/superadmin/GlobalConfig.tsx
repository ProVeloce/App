import React from 'react';
import { Settings, Save } from 'lucide-react';

const GlobalConfig: React.FC = () => (
    <div className="page">
        <div className="page-header">
            <div><h1>System Configuration</h1><p>Global system settings and feature toggles</p></div>
            <button className="btn btn-primary"><Save size={18} /> Save Changes</button>
        </div>
        <div className="config-card">
            <h3>Feature Toggles</h3>
            <p className="desc">Enable or disable platform features</p>
            <div className="empty-state"><Settings size={48} /><h4>Configuration Coming Soon</h4><p>System configurations will be available here</p></div>
        </div>
        <style>{`
      .page { animation: fadeIn 0.3s ease-out; }
      .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-6); }
      .page-header h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: var(--space-1); }
      .page-header p { color: var(--text-secondary); }
      .config-card { background: var(--bg-primary); border-radius: var(--radius-xl); border: 1px solid var(--border-light); padding: var(--space-6); }
      .config-card h3 { font-size: 1rem; font-weight: 600; margin-bottom: var(--space-1); }
      .config-card .desc { color: var(--text-muted); font-size: 0.875rem; margin-bottom: var(--space-6); }
      .empty-state { padding: var(--space-8); text-align: center; color: var(--text-muted); background: var(--bg-secondary); border-radius: var(--radius-lg); }
      .empty-state svg { margin-bottom: var(--space-4); opacity: 0.5; }
      .empty-state h4 { color: var(--text-secondary); margin-bottom: var(--space-2); }
    `}</style>
    </div>
);

export default GlobalConfig;
