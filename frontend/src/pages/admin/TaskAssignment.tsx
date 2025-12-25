import React from 'react';
import { Briefcase, Plus } from 'lucide-react';

const TaskAssignment: React.FC = () => (
    <div className="page">
        <div className="page-header">
            <div><h1>Task Assignment</h1><p>Create and assign tasks to experts</p></div>
            <button className="btn btn-primary"><Plus size={18} /> Create Task</button>
        </div>
        <div className="empty-state"><Briefcase size={48} /><h3>No Tasks</h3><p>Create tasks to assign to experts</p></div>
        <style>{`
      .page { animation: fadeIn 0.3s ease-out; }
      .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-6); }
      .page-header h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: var(--space-1); }
      .page-header p { color: var(--text-secondary); }
      .empty-state { background: var(--bg-primary); border-radius: var(--radius-xl); border: 1px solid var(--border-light); padding: var(--space-12); text-align: center; color: var(--text-muted); }
      .empty-state svg { margin-bottom: var(--space-4); opacity: 0.5; }
      .empty-state h3 { color: var(--text-secondary); margin-bottom: var(--space-2); }
    `}</style>
    </div>
);

export default TaskAssignment;
