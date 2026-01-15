import React, { useState, useEffect, useCallback } from 'react';
import {
    BarChart3, Download, RefreshCw, Calendar, Filter, FileText,
    Users, Ticket, Activity, TrendingUp, PieChart as PieChartIcon,
    Clock, CheckCircle, AlertCircle, XCircle, Loader2, FileSpreadsheet,
    FileDown, ChevronDown, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line
} from 'recharts';
import { adminApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import './ReportsAnalytics.css';

interface AnalyticsData {
    users: {
        total: number;
        byRole: Record<string, number>;
        byStatus: Record<string, number>;
        growth: { date: string; count: number }[];
    };
    tickets: {
        total: number;
        byStatus: Record<string, number>;
        byCategory: Record<string, number>;
        byPriority: Record<string, number>;
        trend: { date: string; count: number }[];
    };
    sessions: {
        total: number;
        byStatus: Record<string, number>;
        trend: { date: string; count: number }[];
    };
    activities: {
        total: number;
        byAction: Record<string, number>;
        recent: any[];
    };
    applications: {
        total: number;
        byStatus: Record<string, number>;
    };
    connects: {
        total: number;
        byStatus: Record<string, number>;
    };
    generatedAt: string;
}

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

const ReportsAnalytics: React.FC = () => {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);

    // Filters
    const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
    const [roleFilter, setRoleFilter] = useState<string>('');

    const { success, error } = useToast();

    const getDateParams = useCallback(() => {
        const now = new Date();
        let startDate: string | undefined;
        
        switch (dateRange) {
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                break;
            default:
                startDate = undefined;
        }
        
        return { startDate, role: roleFilter || undefined };
    }, [dateRange, roleFilter]);

    const fetchAnalytics = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const params = getDateParams();
            const response = await adminApi.getAnalytics(params);
            if (response.data.success && response.data.data) {
                setAnalytics(response.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch analytics:', err);
            error('Failed to load analytics data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [getDateParams, error]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    // Export functions
    const exportToCSV = () => {
        if (!analytics) return;
        
        const rows: string[][] = [
            ['Report Type', 'Category', 'Value'],
            ['Users', 'Total', String(analytics.users.total)],
            ...Object.entries(analytics.users.byRole).map(([role, count]) => ['Users by Role', role, String(count)]),
            ...Object.entries(analytics.users.byStatus).map(([status, count]) => ['Users by Status', status, String(count)]),
            ['Tickets', 'Total', String(analytics.tickets.total)],
            ...Object.entries(analytics.tickets.byStatus).map(([status, count]) => ['Tickets by Status', status, String(count)]),
            ...Object.entries(analytics.tickets.byCategory).map(([cat, count]) => ['Tickets by Category', cat, String(count)]),
            ['Sessions', 'Total', String(analytics.sessions.total)],
            ...Object.entries(analytics.sessions.byStatus).map(([status, count]) => ['Sessions by Status', status, String(count)]),
            ['Applications', 'Total', String(analytics.applications.total)],
            ...Object.entries(analytics.applications.byStatus).map(([status, count]) => ['Applications by Status', status, String(count)]),
            ['Connect Requests', 'Total', String(analytics.connects.total)],
            ...Object.entries(analytics.connects.byStatus).map(([status, count]) => ['Connects by Status', status, String(count)]),
        ];

        const csvContent = rows.map(row => row.join(',')).join('\n');
        downloadFile(csvContent, 'analytics-report.csv', 'text/csv');
        success('CSV report downloaded');
    };

    const exportToJSON = () => {
        if (!analytics) return;
        const jsonContent = JSON.stringify(analytics, null, 2);
        downloadFile(jsonContent, 'analytics-report.json', 'application/json');
        success('JSON report downloaded');
    };

    const exportToExcel = () => {
        if (!analytics) return;
        
        // Create a simple HTML table that Excel can read
        let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body>';
        
        html += '<h2>Platform Analytics Report</h2>';
        html += `<p>Generated: ${new Date(analytics.generatedAt).toLocaleString()}</p>`;
        
        // Users Summary
        html += '<h3>User Statistics</h3><table border="1"><tr><th>Metric</th><th>Value</th></tr>';
        html += `<tr><td>Total Users</td><td>${analytics.users.total}</td></tr>`;
        Object.entries(analytics.users.byRole).forEach(([role, count]) => {
            html += `<tr><td>${role}</td><td>${count}</td></tr>`;
        });
        html += '</table>';
        
        // Tickets Summary
        html += '<h3>Ticket Statistics</h3><table border="1"><tr><th>Status</th><th>Count</th></tr>';
        Object.entries(analytics.tickets.byStatus).forEach(([status, count]) => {
            html += `<tr><td>${status}</td><td>${count}</td></tr>`;
        });
        html += '</table>';
        
        // Sessions
        html += '<h3>Session Statistics</h3><table border="1"><tr><th>Status</th><th>Count</th></tr>';
        Object.entries(analytics.sessions.byStatus).forEach(([status, count]) => {
            html += `<tr><td>${status}</td><td>${count}</td></tr>`;
        });
        html += '</table>';
        
        html += '</body></html>';
        
        downloadFile(html, 'analytics-report.xls', 'application/vnd.ms-excel');
        success('Excel report downloaded');
    };

    const exportToPDF = async () => {
        if (!analytics) return;
        setExporting(true);
        
        // Create printable content
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            error('Please allow popups to export PDF');
            setExporting(false);
            return;
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Analytics Report</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
                    h1 { color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px; }
                    h2 { color: #4f46e5; margin-top: 30px; }
                    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                    th { background: #f3f4f6; }
                    .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
                    .stat-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; }
                    .stat-value { font-size: 24px; font-weight: bold; color: #6366f1; }
                    .stat-label { color: #6b7280; font-size: 14px; }
                    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
                </style>
            </head>
            <body>
                <h1>Platform Analytics Report</h1>
                <p>Generated: ${new Date(analytics.generatedAt).toLocaleString()}</p>
                
                <div class="stat-grid">
                    <div class="stat-card"><div class="stat-value">${analytics.users.total}</div><div class="stat-label">Total Users</div></div>
                    <div class="stat-card"><div class="stat-value">${analytics.tickets.total}</div><div class="stat-label">Total Tickets</div></div>
                    <div class="stat-card"><div class="stat-value">${analytics.sessions.total}</div><div class="stat-label">Total Sessions</div></div>
                </div>
                
                <h2>Users by Role</h2>
                <table>
                    <tr><th>Role</th><th>Count</th></tr>
                    ${Object.entries(analytics.users.byRole).map(([role, count]) => `<tr><td>${role}</td><td>${count}</td></tr>`).join('')}
                </table>
                
                <h2>Users by Status</h2>
                <table>
                    <tr><th>Status</th><th>Count</th></tr>
                    ${Object.entries(analytics.users.byStatus).map(([status, count]) => `<tr><td>${status}</td><td>${count}</td></tr>`).join('')}
                </table>
                
                <h2>Tickets by Status</h2>
                <table>
                    <tr><th>Status</th><th>Count</th></tr>
                    ${Object.entries(analytics.tickets.byStatus).map(([status, count]) => `<tr><td>${status}</td><td>${count}</td></tr>`).join('')}
                </table>
                
                <h2>Tickets by Category</h2>
                <table>
                    <tr><th>Category</th><th>Count</th></tr>
                    ${Object.entries(analytics.tickets.byCategory).map(([cat, count]) => `<tr><td>${cat}</td><td>${count}</td></tr>`).join('')}
                </table>
                
                <h2>Expert Applications</h2>
                <table>
                    <tr><th>Status</th><th>Count</th></tr>
                    ${Object.entries(analytics.applications.byStatus).map(([status, count]) => `<tr><td>${status}</td><td>${count}</td></tr>`).join('')}
                </table>
                
                <h2>Recent Activity</h2>
                <table>
                    <tr><th>Action</th><th>Count</th></tr>
                    ${Object.entries(analytics.activities.byAction).map(([action, count]) => `<tr><td>${action}</td><td>${count}</td></tr>`).join('')}
                </table>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
            setExporting(false);
            success('PDF ready for download');
        }, 500);
    };

    const downloadFile = (content: string, filename: string, mimeType: string) => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setShowExportMenu(false);
    };

    // Format chart data
    const formatUserRoleData = () => {
        if (!analytics) return [];
        return Object.entries(analytics.users.byRole).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value
        }));
    };

    const formatTicketStatusData = () => {
        if (!analytics) return [];
        return Object.entries(analytics.tickets.byStatus).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' '),
            value
        }));
    };

    const formatGrowthData = () => {
        if (!analytics) return [];
        return analytics.users.growth.map(item => ({
            date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            users: item.count
        }));
    };

    const formatTicketTrendData = () => {
        if (!analytics) return [];
        return analytics.tickets.trend.map(item => ({
            date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            tickets: item.count
        }));
    };

    const formatActivityData = () => {
        if (!analytics) return [];
        return Object.entries(analytics.activities.byAction)
            .slice(0, 8)
            .map(([name, value]) => ({
                name: name.replace(/_/g, ' ').substring(0, 15),
                count: value
            }));
    };

    if (loading) {
        return (
            <div className="reports-loading">
                <Loader2 size={40} className="spin" />
                <p>Loading analytics...</p>
            </div>
        );
    }

    return (
        <div className="reports-analytics">
            {/* Header */}
            <header className="reports-header">
                <div className="header-left">
                    <h1><BarChart3 size={24} /> Reports & Analytics</h1>
                    <p>Platform insights, metrics, and performance tracking</p>
                </div>
                <div className="header-actions">
                    <button
                        className="btn btn-secondary"
                        onClick={() => fetchAnalytics(true)}
                        disabled={refreshing}
                    >
                        <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                    <div className="export-dropdown">
                        <button
                            className="btn btn-primary"
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            disabled={exporting}
                        >
                            <Download size={16} />
                            Export Report
                            <ChevronDown size={14} />
                        </button>
                        {showExportMenu && (
                            <div className="export-menu">
                                <button onClick={exportToPDF}>
                                    <FileText size={16} /> Export as PDF
                                </button>
                                <button onClick={exportToExcel}>
                                    <FileSpreadsheet size={16} /> Export as Excel
                                </button>
                                <button onClick={exportToCSV}>
                                    <FileDown size={16} /> Export as CSV
                                </button>
                                <button onClick={exportToJSON}>
                                    <FileText size={16} /> Export as JSON
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Filters */}
            <div className="reports-filters">
                <div className="filter-group">
                    <label><Calendar size={14} /> Date Range</label>
                    <select value={dateRange} onChange={(e) => setDateRange(e.target.value as any)}>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                        <option value="90d">Last 90 Days</option>
                        <option value="all">All Time</option>
                    </select>
                </div>
                <div className="filter-group">
                    <label><Filter size={14} /> Role Filter</label>
                    <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                        <option value="">All Roles</option>
                        <option value="customer">Customer</option>
                        <option value="expert">Expert</option>
                        <option value="analyst">Analyst</option>
                        <option value="admin">Admin</option>
                        <option value="superadmin">SuperAdmin</option>
                    </select>
                </div>
                {analytics?.generatedAt && (
                    <div className="last-updated">
                        <Clock size={14} />
                        Last updated: {new Date(analytics.generatedAt).toLocaleString()}
                    </div>
                )}
            </div>

            {/* Overview Stats */}
            <section className="stats-overview">
                <div className="stat-card primary">
                    <div className="stat-icon"><Users size={24} /></div>
                    <div className="stat-info">
                        <span className="stat-value">{analytics?.users.total || 0}</span>
                        <span className="stat-label">Total Users</span>
                    </div>
                    <div className="stat-trend up">
                        <ArrowUpRight size={14} />
                        <span>+{analytics?.users.growth.slice(-1)[0]?.count || 0} today</span>
                    </div>
                </div>
                <div className="stat-card success">
                    <div className="stat-icon"><Ticket size={24} /></div>
                    <div className="stat-info">
                        <span className="stat-value">{analytics?.tickets.total || 0}</span>
                        <span className="stat-label">Total Tickets</span>
                    </div>
                    <div className="stat-trend">
                        <span>{analytics?.tickets.byStatus.open || 0} open</span>
                    </div>
                </div>
                <div className="stat-card warning">
                    <div className="stat-icon"><Activity size={24} /></div>
                    <div className="stat-info">
                        <span className="stat-value">{analytics?.sessions.total || 0}</span>
                        <span className="stat-label">Sessions</span>
                    </div>
                </div>
                <div className="stat-card info">
                    <div className="stat-icon"><TrendingUp size={24} /></div>
                    <div className="stat-info">
                        <span className="stat-value">{analytics?.activities.total || 0}</span>
                        <span className="stat-label">Activities</span>
                    </div>
                </div>
                <div className="stat-card purple">
                    <div className="stat-icon"><FileText size={24} /></div>
                    <div className="stat-info">
                        <span className="stat-value">{analytics?.applications.total || 0}</span>
                        <span className="stat-label">Applications</span>
                    </div>
                </div>
                <div className="stat-card accent">
                    <div className="stat-icon"><CheckCircle size={24} /></div>
                    <div className="stat-info">
                        <span className="stat-value">{analytics?.connects.total || 0}</span>
                        <span className="stat-label">Connects</span>
                    </div>
                </div>
            </section>

            {/* Charts Grid */}
            <div className="charts-grid">
                {/* User Growth Chart */}
                <div className="chart-card span-2">
                    <div className="chart-header">
                        <h3><TrendingUp size={18} /> User Growth Trend</h3>
                        <span className="chart-subtitle">New registrations over time</span>
                    </div>
                    <div className="chart-body">
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={formatGrowthData()} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                                <defs>
                                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis 
                                    dataKey="date" 
                                    tick={{ fontSize: 11 }} 
                                    stroke="#9ca3af"
                                    tickMargin={8}
                                />
                                <YAxis 
                                    tick={{ fontSize: 11 }} 
                                    stroke="#9ca3af"
                                    tickMargin={8}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="users"
                                    stroke="#6366f1"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorUsers)"
                                    name="New Users"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* User Distribution Pie */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3><PieChartIcon size={18} /> User Distribution</h3>
                        <span className="chart-subtitle">By role</span>
                    </div>
                    <div className="chart-body pie-chart-body">
                        <ResponsiveContainer width="100%" height={320}>
                            <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                                <Pie
                                    data={formatUserRoleData()}
                                    cx="50%"
                                    cy="40%"
                                    innerRadius={45}
                                    outerRadius={75}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {formatUserRoleData().map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => [value, 'Users']} />
                                <Legend 
                                    layout="horizontal" 
                                    verticalAlign="bottom" 
                                    align="center"
                                    wrapperStyle={{ paddingTop: '20px' }}
                                    formatter={(value, entry: any) => (
                                        <span style={{ color: 'var(--text-primary)', fontSize: '12px' }}>
                                            {value} ({entry.payload?.value || 0})
                                        </span>
                                    )}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Ticket Trend */}
                <div className="chart-card span-2">
                    <div className="chart-header">
                        <h3><Ticket size={18} /> Ticket Trend</h3>
                        <span className="chart-subtitle">Tickets over the last 14 days</span>
                    </div>
                    <div className="chart-body">
                        <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={formatTicketTrendData()} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis 
                                    dataKey="date" 
                                    tick={{ fontSize: 11 }} 
                                    stroke="#9ca3af"
                                    tickMargin={8}
                                />
                                <YAxis 
                                    tick={{ fontSize: 11 }} 
                                    stroke="#9ca3af"
                                    tickMargin={8}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="tickets"
                                    stroke="#22c55e"
                                    strokeWidth={2}
                                    dot={{ fill: '#22c55e', strokeWidth: 2 }}
                                    activeDot={{ r: 6 }}
                                    name="Tickets"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Ticket Status Pie */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3><PieChartIcon size={18} /> Ticket Status</h3>
                        <span className="chart-subtitle">Distribution by status</span>
                    </div>
                    <div className="chart-body pie-chart-body">
                        <ResponsiveContainer width="100%" height={320}>
                            <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                                <Pie
                                    data={formatTicketStatusData()}
                                    cx="50%"
                                    cy="40%"
                                    innerRadius={45}
                                    outerRadius={75}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {formatTicketStatusData().map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => [value, 'Tickets']} />
                                <Legend 
                                    layout="horizontal" 
                                    verticalAlign="bottom" 
                                    align="center"
                                    wrapperStyle={{ paddingTop: '20px' }}
                                    formatter={(value, entry: any) => (
                                        <span style={{ color: 'var(--text-primary)', fontSize: '12px' }}>
                                            {value} ({entry.payload?.value || 0})
                                        </span>
                                    )}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Activity Bar Chart */}
                <div className="chart-card span-2">
                    <div className="chart-header">
                        <h3><Activity size={18} /> Top Activities</h3>
                        <span className="chart-subtitle">Most common actions</span>
                    </div>
                    <div className="chart-body">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={formatActivityData()} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis 
                                    type="number" 
                                    tick={{ fontSize: 11 }} 
                                    stroke="#9ca3af"
                                    tickMargin={8}
                                    allowDecimals={false}
                                />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    tick={{ fontSize: 10 }} 
                                    stroke="#9ca3af" 
                                    width={120}
                                    tickMargin={8}
                                />
                                <Tooltip
                                    contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                                    formatter={(value: number) => [value, 'Count']}
                                />
                                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Actions" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Application Status */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3><FileText size={18} /> Expert Applications</h3>
                        <span className="chart-subtitle">By status</span>
                    </div>
                    <div className="chart-body status-list">
                        {Object.entries(analytics?.applications.byStatus || {}).map(([status, count]) => (
                            <div key={status} className={`status-item ${status.toLowerCase()}`}>
                                <span className="status-name">{status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')}</span>
                                <span className="status-count">{count}</span>
                            </div>
                        ))}
                        {Object.keys(analytics?.applications.byStatus || {}).length === 0 && (
                            <p className="no-data">No application data</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Data Tables Section */}
            <section className="data-tables-section">
                <h2><FileText size={20} /> Detailed Breakdown</h2>
                
                <div className="tables-grid">
                    {/* Users by Status Table */}
                    <div className="table-card">
                        <h3>Users by Status</h3>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Status</th>
                                    <th>Count</th>
                                    <th>Percentage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(analytics?.users.byStatus || {}).map(([status, count]) => (
                                    <tr key={status}>
                                        <td>
                                            <span className={`status-badge ${status.toLowerCase()}`}>
                                                {status === 'active' && <CheckCircle size={12} />}
                                                {status === 'pending_verification' && <Clock size={12} />}
                                                {status === 'suspended' && <XCircle size={12} />}
                                                {status.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td>{count}</td>
                                        <td>{((count / (analytics?.users.total || 1)) * 100).toFixed(1)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Tickets by Category Table */}
                    <div className="table-card">
                        <h3>Tickets by Category</h3>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Category</th>
                                    <th>Count</th>
                                    <th>Percentage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(analytics?.tickets.byCategory || {}).map(([category, count]) => (
                                    <tr key={category}>
                                        <td>{category}</td>
                                        <td>{count}</td>
                                        <td>{((count / (analytics?.tickets.total || 1)) * 100).toFixed(1)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Connect Requests Table */}
                    <div className="table-card">
                        <h3>Connect Requests by Status</h3>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Status</th>
                                    <th>Count</th>
                                    <th>Percentage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(analytics?.connects.byStatus || {}).map(([status, count]) => (
                                    <tr key={status}>
                                        <td>
                                            <span className={`status-badge ${status.toLowerCase()}`}>
                                                {status.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td>{count}</td>
                                        <td>{((count / (analytics?.connects.total || 1)) * 100).toFixed(1)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Sessions Table */}
                    <div className="table-card">
                        <h3>Sessions by Status</h3>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Status</th>
                                    <th>Count</th>
                                    <th>Percentage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(analytics?.sessions.byStatus || {}).map(([status, count]) => (
                                    <tr key={status}>
                                        <td>
                                            <span className={`status-badge ${status.toLowerCase()}`}>
                                                {status.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td>{count}</td>
                                        <td>{((count / (analytics?.sessions.total || 1)) * 100).toFixed(1)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Recent Activity Section */}
            <section className="recent-activity-section">
                <h2><Activity size={20} /> Recent Activity Log</h2>
                <div className="activity-table-wrapper">
                    <table className="activity-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Action</th>
                                <th>Entity</th>
                                <th>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(analytics?.activities.recent || []).map((activity, idx) => (
                                <tr key={activity.id || idx}>
                                    <td>{activity.user_name || 'System'}</td>
                                    <td>
                                        <span className="action-badge">
                                            {activity.action?.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td>{activity.entity_type || '-'}</td>
                                    <td>{activity.created_at ? new Date(activity.created_at).toLocaleString() : '-'}</td>
                                </tr>
                            ))}
                            {(!analytics?.activities.recent || analytics.activities.recent.length === 0) && (
                                <tr>
                                    <td colSpan={4} className="no-data">No recent activity</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default ReportsAnalytics;
