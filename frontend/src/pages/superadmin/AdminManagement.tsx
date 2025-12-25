import React from 'react';
import { Shield, Plus } from 'lucide-react';

const AdminManagement: React.FC = () => (
    <div className="page">
        <div className="page-header">
            <div><h1>Admin Management</h1><p>Manage admin and analyst accounts</p></div>
            <button className="btn btn-primary"><Plus size={18} /> Add Admin</button>
        </div>
        <div className="empty-state"><Shield size={48} /><h3>No Admins</h3><p>Admin accounts will be listed here</p></div>
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

export default AdminManagement;
