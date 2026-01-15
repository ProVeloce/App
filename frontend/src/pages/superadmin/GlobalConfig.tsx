import React, { useState, useEffect, useMemo } from 'react';
import {
    Settings, Save, RefreshCw, Shield, Bell, Ticket, Palette, BarChart3,
    Users, ToggleLeft, ToggleRight, ChevronDown, ChevronRight, Check,
    AlertCircle, Lock, Mail, Clock, Globe, FileText, Loader2, Info, Wrench, Calendar
} from 'lucide-react';
import { configApi, SystemConfig } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useConfig, broadcastConfigUpdate } from '../../context/ConfigContext';
import { formatForInput, formatDateTime, IST_TIMEZONE } from '../../utils/dateUtils';
import './GlobalConfig.css';

interface CategoryInfo {
    id: string;
    label: string;
    icon: React.ReactNode;
    description: string;
}

const CATEGORIES: CategoryInfo[] = [
    { id: 'system', label: 'System & Maintenance', icon: <Wrench size={20} />, description: 'Maintenance mode and system settings' },
    { id: 'auth', label: 'Authentication & Security', icon: <Lock size={20} />, description: 'Login, sessions, and password policies' },
    { id: 'users', label: 'User Management', icon: <Users size={20} />, description: 'Registration and profile settings' },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={20} />, description: 'Email, SMS, and in-app alerts' },
    { id: 'ticketing', label: 'Help Desk & Ticketing', icon: <Ticket size={20} />, description: 'Support ticket defaults' },
    { id: 'ui', label: 'UI/UX Preferences', icon: <Palette size={20} />, description: 'Theme, language, and display' },
    { id: 'analytics', label: 'Analytics & Reporting', icon: <BarChart3 size={20} />, description: 'Data retention and exports' },
    { id: 'features', label: 'Feature Toggles', icon: <ToggleLeft size={20} />, description: 'Enable or disable features' },
];

const SELECT_OPTIONS: Record<string, { value: string; label: string }[]> = {
    digest_frequency: [
        { value: 'realtime', label: 'Real-time' },
        { value: 'hourly', label: 'Hourly' },
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
    ],
    default_priority: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'urgent', label: 'Urgent' },
    ],
    default_theme: [
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
        { value: 'system', label: 'System Default' },
    ],
    default_language: [
        { value: 'en', label: 'English' },
        { value: 'es', label: 'Spanish' },
        { value: 'fr', label: 'French' },
        { value: 'de', label: 'German' },
        { value: 'hi', label: 'Hindi' },
    ],
    date_format: [
        { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
        { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
        { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
    ],
    time_format: [
        { value: '24h', label: '24-hour' },
        { value: '12h', label: '12-hour (AM/PM)' },
    ],
    default_export_format: [
        { value: 'csv', label: 'CSV' },
        { value: 'excel', label: 'Excel' },
        { value: 'pdf', label: 'PDF' },
        { value: 'json', label: 'JSON' },
    ],
    default_user_role: [
        { value: 'customer', label: 'Customer' },
        { value: 'expert', label: 'Expert' },
        { value: 'analyst', label: 'Analyst' },
    ],
};

const GlobalConfig: React.FC = () => {
    const [configs, setConfigs] = useState<SystemConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['system', 'auth', 'features']));
    const [pendingChanges, setPendingChanges] = useState<Map<string, string>>(new Map());
    const [searchQuery, setSearchQuery] = useState('');

    const { success, error } = useToast();
    const { refreshConfig } = useConfig();

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const response = await configApi.getSystemConfig();
            if (response.data && response.data.success && response.data.data) {
                setConfigs(response.data.data);
            } else if (response.data && !response.data.success) {
                setLoadError(response.data.error || 'Failed to load configurations');
                error(response.data.error || 'Failed to load configurations');
            } else {
                // Handle unexpected response format
                console.warn('Unexpected config response format:', response.data);
                setConfigs([]);
            }
        } catch (err: any) {
            console.error('Failed to fetch configs:', err);
            // Check for specific error types
            const errorMessage = err.response?.data?.error 
                || err.message 
                || 'Failed to load configurations. Please try again.';
            setLoadError(errorMessage);
            error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleValueChange = (config: SystemConfig, newValue: string) => {
        setPendingChanges(prev => {
            const next = new Map(prev);
            if (newValue === config.value) {
                next.delete(config.id);
            } else {
                next.set(config.id, newValue);
            }
            return next;
        });
    };

    const handleSaveAll = async () => {
        if (pendingChanges.size === 0) {
            error('No changes to save');
            return;
        }

        setSaving(true);
        try {
            const updates = Array.from(pendingChanges.entries()).map(([id, value]) => ({
                id,
                value,
            }));

            await configApi.bulkUpdateConfig(updates);
            success(`${updates.length} configuration(s) saved successfully. Changes applied globally.`);
            setPendingChanges(new Map());
            
            // Refresh local configs
            fetchConfigs();
            
            // Broadcast config update to all tabs and refresh global context
            broadcastConfigUpdate();
            await refreshConfig();
        } catch (err) {
            console.error('Failed to save configs:', err);
            error('Failed to save configurations');
        } finally {
            setSaving(false);
        }
    };

    const handleResetChanges = () => {
        setPendingChanges(new Map());
    };

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(categoryId)) {
                next.delete(categoryId);
            } else {
                next.add(categoryId);
            }
            return next;
        });
    };

    const getConfigsByCategory = useMemo(() => {
        const grouped: Record<string, SystemConfig[]> = {};
        
        configs.forEach(cfg => {
            const matchesSearch = searchQuery === '' || 
                cfg.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                cfg.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                cfg.key.toLowerCase().includes(searchQuery.toLowerCase());
            
            if (matchesSearch) {
                if (!grouped[cfg.category]) {
                    grouped[cfg.category] = [];
                }
                grouped[cfg.category].push(cfg);
            }
        });
        
        return grouped;
    }, [configs, searchQuery]);

    const getCurrentValue = (config: SystemConfig): string => {
        return pendingChanges.has(config.id) ? pendingChanges.get(config.id)! : config.value;
    };

    const renderConfigControl = (config: SystemConfig) => {
        const currentValue = getCurrentValue(config);
        const hasChange = pendingChanges.has(config.id);

        switch (config.type) {
            case 'boolean':
                const isEnabled = currentValue === 'true';
                return (
                    <button
                        className={`toggle-btn ${isEnabled ? 'active' : ''} ${hasChange ? 'changed' : ''}`}
                        onClick={() => handleValueChange(config, isEnabled ? 'false' : 'true')}
                    >
                        {isEnabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                        <span>{isEnabled ? 'Enabled' : 'Disabled'}</span>
                    </button>
                );

            case 'number':
                return (
                    <input
                        type="number"
                        className={`config-input ${hasChange ? 'changed' : ''}`}
                        value={currentValue}
                        onChange={(e) => handleValueChange(config, e.target.value)}
                        min="0"
                    />
                );

            case 'select':
                const options = SELECT_OPTIONS[config.key] || [];
                return (
                    <select
                        className={`config-select ${hasChange ? 'changed' : ''}`}
                        value={currentValue}
                        onChange={(e) => handleValueChange(config, e.target.value)}
                    >
                        {options.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                );

            case 'datetime':
                // Convert ISO string to datetime-local format for input
                const datetimeValue = currentValue ? formatForInput(currentValue) : '';
                return (
                    <div className="datetime-input-wrapper">
                        <input
                            type="datetime-local"
                            className={`config-input datetime-input ${hasChange ? 'changed' : ''}`}
                            value={datetimeValue}
                            onChange={(e) => {
                                // Store the datetime-local value - will be converted to IST on display
                                const inputValue = e.target.value;
                                if (inputValue) {
                                    // Convert to ISO format with IST indication
                                    const date = new Date(inputValue);
                                    handleValueChange(config, date.toISOString());
                                } else {
                                    handleValueChange(config, '');
                                }
                            }}
                        />
                        {currentValue && (
                            <span className="datetime-display">
                                <Clock size={12} />
                                {formatDateTime(currentValue)} IST
                            </span>
                        )}
                        <button 
                            className="clear-datetime-btn"
                            onClick={() => handleValueChange(config, '')}
                            title="Clear date/time"
                        >
                            ×
                        </button>
                    </div>
                );

            case 'time':
                // Time only input in 24-hour format
                const timeValue = currentValue || '';
                return (
                    <input
                        type="time"
                        className={`config-input time-input ${hasChange ? 'changed' : ''}`}
                        value={timeValue}
                        onChange={(e) => handleValueChange(config, e.target.value)}
                    />
                );

            default:
                // Check if key contains 'time' or 'date' for automatic datetime handling
                if (config.key.includes('_time') || config.key.includes('_date') || config.key.includes('end_time')) {
                    const autoDatetimeValue = currentValue ? formatForInput(currentValue) : '';
                    return (
                        <div className="datetime-input-wrapper">
                            <input
                                type="datetime-local"
                                className={`config-input datetime-input ${hasChange ? 'changed' : ''}`}
                                value={autoDatetimeValue}
                                onChange={(e) => {
                                    const inputValue = e.target.value;
                                    if (inputValue) {
                                        const date = new Date(inputValue);
                                        handleValueChange(config, date.toISOString());
                                    } else {
                                        handleValueChange(config, '');
                                    }
                                }}
                            />
                            {currentValue && (
                                <span className="datetime-display">
                                    <Clock size={12} />
                                    {formatDateTime(currentValue)} IST
                                </span>
                            )}
                            <button 
                                className="clear-datetime-btn"
                                onClick={() => handleValueChange(config, '')}
                                title="Clear date/time"
                            >
                                ×
                            </button>
                        </div>
                    );
                }
                return (
                    <input
                        type="text"
                        className={`config-input ${hasChange ? 'changed' : ''}`}
                        value={currentValue}
                        onChange={(e) => handleValueChange(config, e.target.value)}
                    />
                );
        }
    };

    if (loading) {
        return (
            <div className="config-loading">
                <Loader2 size={40} className="spin" />
                <p>Loading configurations...</p>
            </div>
        );
    }

    if (loadError && configs.length === 0) {
        return (
            <div className="config-loading">
                <AlertCircle size={40} className="error-icon" />
                <p className="error-text">{loadError}</p>
                <button className="btn btn-primary" onClick={fetchConfigs}>
                    <RefreshCw size={16} />
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="global-config">
            {/* Header */}
            <header className="config-header">
                <div className="header-left">
                    <h1><Settings size={24} /> System Configuration</h1>
                    <p>Manage global settings and feature toggles</p>
                </div>
                <div className="header-actions">
                    {pendingChanges.size > 0 && (
                        <div className="pending-badge">
                            <AlertCircle size={14} />
                            {pendingChanges.size} unsaved change{pendingChanges.size > 1 ? 's' : ''}
                        </div>
                    )}
                    <button className="btn btn-secondary" onClick={handleResetChanges} disabled={pendingChanges.size === 0}>
                        Reset
                    </button>
                    <button className="btn btn-secondary" onClick={fetchConfigs} disabled={saving}>
                        <RefreshCw size={16} className={loading ? 'spin' : ''} />
                        Refresh
                    </button>
                    <button 
                        className="btn btn-primary" 
                        onClick={handleSaveAll} 
                        disabled={pendingChanges.size === 0 || saving}
                    >
                        {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                        {saving ? 'Saving...' : 'Save All Changes'}
                    </button>
                </div>
            </header>

            {/* Search */}
            <div className="config-search">
                <input
                    type="text"
                    placeholder="Search configurations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Categories */}
            <div className="config-categories">
                {CATEGORIES.map(category => {
                    const categoryConfigs = getConfigsByCategory[category.id] || [];
                    const isExpanded = expandedCategories.has(category.id);
                    const hasChangesInCategory = categoryConfigs.some(c => pendingChanges.has(c.id));

                    if (searchQuery && categoryConfigs.length === 0) return null;

                    return (
                        <div key={category.id} className={`config-category ${isExpanded ? 'expanded' : ''}`}>
                            <button
                                className="category-header"
                                onClick={() => toggleCategory(category.id)}
                            >
                                <div className="category-icon">{category.icon}</div>
                                <div className="category-info">
                                    <h3>
                                        {category.label}
                                        {hasChangesInCategory && <span className="change-dot" />}
                                    </h3>
                                    <p>{category.description}</p>
                                </div>
                                <div className="category-meta">
                                    <span className="config-count">{categoryConfigs.length} settings</span>
                                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                </div>
                            </button>

                            {isExpanded && (
                                <div className="category-content">
                                    {categoryConfigs.length === 0 ? (
                                        <p className="no-configs">No configurations in this category</p>
                                    ) : (
                                        <div className="config-grid">
                                            {categoryConfigs.map(config => (
                                                <div 
                                                    key={config.id} 
                                                    className={`config-item ${pendingChanges.has(config.id) ? 'has-change' : ''}`}
                                                >
                                                    <div className="config-info">
                                                        <label>{config.label}</label>
                                                        <p className="config-description">
                                                            <Info size={12} />
                                                            {config.description}
                                                        </p>
                                                    </div>
                                                    <div className="config-control">
                                                        {renderConfigControl(config)}
                                                        {pendingChanges.has(config.id) && (
                                                            <span className="change-indicator">
                                                                <Check size={12} /> Modified
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Info Footer */}
            <div className="config-footer">
                <div className="footer-info">
                    <Shield size={16} />
                    <span>Changes are applied globally across the platform. Use with caution.</span>
                </div>
                {configs[0]?.updated_at && (
                    <div className="last-updated">
                        <Clock size={14} />
                        Last updated: {new Date(configs[0].updated_at).toLocaleString()}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GlobalConfig;
