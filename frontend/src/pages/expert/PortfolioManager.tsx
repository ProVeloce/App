import React from 'react';
import { FolderOpen, Plus } from 'lucide-react';

const PortfolioManager: React.FC = () => (
    <div className="page">
        <div className="page-header"><h1>Portfolio</h1><p>Showcase your work and expertise</p></div>
        <div className="empty-state">
            <FolderOpen size={48} />
            <h3>No Portfolio Items</h3>
            <p>Add your best work to attract clients</p>
            <button className="btn btn-primary"><Plus size={18} /> Add Portfolio Item</button>
        </div>
        <style>{`
      .page { animation: fadeIn 0.3s ease-out; }
      .page-header { margin-bottom: var(--space-6); display: flex; justify-content: space-between; align-items: center; }
      .page-header h1 { font-size: 1.5rem; font-weight: 700; }
      .page-header p { color: var(--text-secondary); }
      .empty-state { background: var(--bg-primary); border-radius: var(--radius-xl); border: 1px solid var(--border-light); padding: var(--space-12); text-align: center; color: var(--text-muted); }
      .empty-state svg { margin-bottom: var(--space-4); opacity: 0.5; }
      .empty-state h3 { color: var(--text-secondary); margin-bottom: var(--space-2); }
      .empty-state p { margin-bottom: var(--space-6); }
    `}</style>
    </div>
);

export default PortfolioManager;
