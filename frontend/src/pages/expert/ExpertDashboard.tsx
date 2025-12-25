import React from 'react';
import { Briefcase, CheckCircle, Clock, TrendingUp } from 'lucide-react';

const ExpertDashboard: React.FC = () => (
    <div className="page">
        <div className="page-header">
            <h1>Expert Dashboard</h1>
            <p>Overview of your tasks and performance</p>
        </div>
        <div className="stats-grid">
            <div className="stat-card"><div className="stat-icon primary"><Briefcase size={24} /></div><div className="stat-content"><span className="stat-value">0</span><span className="stat-label">Active Tasks</span></div></div>
            <div className="stat-card"><div className="stat-icon success"><CheckCircle size={24} /></div><div className="stat-content"><span className="stat-value">0</span><span className="stat-label">Completed</span></div></div>
            <div className="stat-card"><div className="stat-icon warning"><Clock size={24} /></div><div className="stat-content"><span className="stat-value">0</span><span className="stat-label">Pending</span></div></div>
            <div className="stat-card"><div className="stat-icon accent"><TrendingUp size={24} /></div><div className="stat-content"><span className="stat-value">$0</span><span className="stat-label">Earnings</span></div></div>
        </div>
        <style>{`
      .page { animation: fadeIn 0.3s ease-out; }
      .page-header { margin-bottom: var(--space-6); }
      .page-header h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: var(--space-1); }
      .page-header p { color: var(--text-secondary); }
      .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-4); }
      .stat-card { display: flex; align-items: center; gap: var(--space-4); padding: var(--space-5); background: var(--bg-primary); border-radius: var(--radius-xl); border: 1px solid var(--border-light); }
      .stat-icon { width: 48px; height: 48px; border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; }
      .stat-icon.primary { background: var(--primary-100); color: var(--primary-600); }
      .stat-icon.success { background: var(--success-50); color: var(--success-600); }
      .stat-icon.warning { background: var(--warning-50); color: var(--warning-600); }
      .stat-icon.accent { background: var(--accent-100); color: var(--accent-600); }
      .stat-value { display: block; font-size: 1.5rem; font-weight: 700; }
      .stat-label { font-size: 0.875rem; color: var(--text-muted); }
    `}</style>
    </div>
);

export default ExpertDashboard;
