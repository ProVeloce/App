import React from 'react';
import { Wallet, TrendingUp, DollarSign, ArrowUpRight } from 'lucide-react';

const Earnings: React.FC = () => (
    <div className="page">
        <div className="page-header"><h1>Earnings</h1><p>Track your income and withdrawals</p></div>
        <div className="stats-grid">
            <div className="stat-card"><div className="stat-icon success"><DollarSign size={24} /></div><div className="stat-content"><span className="stat-value">₹0.00</span><span className="stat-label">Available Balance</span></div></div>
            <div className="stat-card"><div className="stat-icon primary"><TrendingUp size={24} /></div><div className="stat-content"><span className="stat-value">₹0.00</span><span className="stat-label">Total Earned</span></div></div>
            <div className="stat-card"><div className="stat-icon warning"><ArrowUpRight size={24} /></div><div className="stat-content"><span className="stat-value">₹0.00</span><span className="stat-label">Pending</span></div></div>
        </div>
        <div className="empty-state">
            <Wallet size={48} />
            <h3>No Transactions</h3>
            <p>Your earnings and withdrawals will appear here</p>
        </div>
        <style>{`
      .page { animation: fadeIn 0.3s ease-out; }
      .page-header { margin-bottom: var(--space-6); }
      .page-header h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: var(--space-1); }
      .page-header p { color: var(--text-secondary); }
      .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-4); margin-bottom: var(--space-6); }
      .stat-card { display: flex; align-items: center; gap: var(--space-4); padding: var(--space-5); background: var(--bg-primary); border-radius: var(--radius-xl); border: 1px solid var(--border-light); }
      .stat-icon { width: 48px; height: 48px; border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; }
      .stat-icon.primary { background: var(--primary-100); color: var(--primary-600); }
      .stat-icon.success { background: var(--success-50); color: var(--success-600); }
      .stat-icon.warning { background: var(--warning-50); color: var(--warning-600); }
      .stat-value { display: block; font-size: 1.5rem; font-weight: 700; }
      .stat-label { font-size: 0.875rem; color: var(--text-muted); }
      .empty-state { background: var(--bg-primary); border-radius: var(--radius-xl); border: 1px solid var(--border-light); padding: var(--space-12); text-align: center; color: var(--text-muted); }
      .empty-state svg { margin-bottom: var(--space-4); opacity: 0.5; }
      .empty-state h3 { color: var(--text-secondary); margin-bottom: var(--space-2); }
    `}</style>
    </div>
);

export default Earnings;
