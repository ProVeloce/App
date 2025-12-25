import React from 'react';
import { Briefcase } from 'lucide-react';

const TaskManagement: React.FC = () => (
    <div className="page">
        <div className="page-header"><h1>My Tasks</h1><p>Manage your assigned tasks</p></div>
        <div className="empty-state">
            <Briefcase size={48} />
            <h3>No Tasks Assigned</h3>
            <p>Tasks assigned to you will appear here</p>
        </div>
        <style>{`
      .page { animation: fadeIn 0.3s ease-out; }
      .page-header { margin-bottom: var(--space-6); }
      .page-header h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: var(--space-1); }
      .page-header p { color: var(--text-secondary); }
      .empty-state { background: var(--bg-primary); border-radius: var(--radius-xl); border: 1px solid var(--border-light); padding: var(--space-12); text-align: center; color: var(--text-muted); }
      .empty-state svg { margin-bottom: var(--space-4); opacity: 0.5; }
      .empty-state h3 { color: var(--text-secondary); margin-bottom: var(--space-2); }
    `}</style>
    </div>
);

export default TaskManagement;
