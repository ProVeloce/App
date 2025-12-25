import React from 'react';
import { Users, Search, Plus } from 'lucide-react';

const UserManagement: React.FC = () => (
    <div className="page">
        <div className="page-header">
            <div><h1>User Management</h1><p>Manage platform users</p></div>
            <button className="btn btn-primary"><Plus size={18} /> Add User</button>
        </div>
        <div className="toolbar">
            <div className="search-box"><Search size={18} /><input type="text" placeholder="Search users..." /></div>
            <select><option>All Roles</option><option>Customer</option><option>Expert</option><option>Analyst</option><option>Admin</option></select>
            <select><option>All Status</option><option>Active</option><option>Suspended</option></select>
        </div>
        <div className="empty-state"><Users size={48} /><h3>No Users Found</h3><p>Users will appear here once the system is connected</p></div>
        <style>{`
      .page { animation: fadeIn 0.3s ease-out; }
      .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-6); }
      .page-header h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: var(--space-1); }
      .page-header p { color: var(--text-secondary); }
      .toolbar { display: flex; gap: var(--space-3); margin-bottom: var(--space-6); }
      .search-box { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-4); background: var(--bg-primary); border: 1px solid var(--border-medium); border-radius: var(--radius-lg); flex: 1; max-width: 300px; }
      .search-box svg { color: var(--text-muted); }
      .search-box input { border: none; background: none; outline: none; width: 100%; color: var(--text-primary); }
      select { padding: var(--space-2) var(--space-4); border: 1px solid var(--border-medium); border-radius: var(--radius-lg); background: var(--bg-primary); color: var(--text-primary); }
      .empty-state { background: var(--bg-primary); border-radius: var(--radius-xl); border: 1px solid var(--border-light); padding: var(--space-12); text-align: center; color: var(--text-muted); }
      .empty-state svg { margin-bottom: var(--space-4); opacity: 0.5; }
      .empty-state h3 { color: var(--text-secondary); margin-bottom: var(--space-2); }
    `}</style>
    </div>
);

export default UserManagement;
