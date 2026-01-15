import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import axios from 'axios';

// System configuration interface
export interface SystemConfig {
    id: string;
    category: string;
    key: string;
    value: string;
    type: string;
    label: string;
    description: string;
    updated_at?: string;
    updated_by?: string;
}

// Typed configuration values
export interface AppConfig {
    // Authentication & Security
    auth: {
        sessionTimeout: number;
        maxLoginAttempts: number;
        lockoutDuration: number;
        passwordMinLength: number;
        requireMfa: boolean;
    };
    // User Management
    users: {
        defaultRole: string;
        requireEmailVerification: boolean;
        allowSelfRegistration: boolean;
    };
    // Notifications
    notifications: {
        emailEnabled: boolean;
        smsEnabled: boolean;
        inAppEnabled: boolean;
        digestFrequency: string;
    };
    // Ticketing
    ticketing: {
        autoAssign: boolean;
        defaultPriority: string;
        escalationHours: number;
        autoCloseAfterDays: number;
    };
    // UI/UX
    ui: {
        defaultTheme: 'light' | 'dark' | 'system';
        defaultLanguage: string;
        dateFormat: string;
        timeFormat: string;
    };
    // Analytics
    analytics: {
        dataRetentionDays: number;
        defaultExportFormat: string;
    };
    // Features
    features: {
        expertApplications: boolean;
        connectRequests: boolean;
        liveChat: boolean;
        videoSessions: boolean;
    };
}

// Default configuration values (used as fallback)
const DEFAULT_CONFIG: AppConfig = {
    auth: {
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        lockoutDuration: 15,
        passwordMinLength: 8,
        requireMfa: false,
    },
    users: {
        defaultRole: 'customer',
        requireEmailVerification: true,
        allowSelfRegistration: true,
    },
    notifications: {
        emailEnabled: true,
        smsEnabled: false,
        inAppEnabled: true,
        digestFrequency: 'daily',
    },
    ticketing: {
        autoAssign: false,
        defaultPriority: 'medium',
        escalationHours: 24,
        autoCloseAfterDays: 7,
    },
    ui: {
        defaultTheme: 'system',
        defaultLanguage: 'en',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
    },
    analytics: {
        dataRetentionDays: 90,
        defaultExportFormat: 'csv',
    },
    features: {
        expertApplications: true,
        connectRequests: true,
        liveChat: false,
        videoSessions: false,
    },
};

interface ConfigContextType {
    // Raw configs from database
    rawConfigs: SystemConfig[];
    // Typed config object
    config: AppConfig;
    // Loading state
    isLoading: boolean;
    // Error state
    error: string | null;
    // Refresh configs from server
    refreshConfig: () => Promise<void>;
    // Get a specific config value
    getConfigValue: (category: string, key: string) => string | undefined;
    // Check if a feature is enabled
    isFeatureEnabled: (featureKey: string) => boolean;
    // Last updated timestamp
    lastUpdated: Date | null;
    // Version for cache invalidation
    configVersion: number;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

// Local storage key for caching
const CONFIG_CACHE_KEY = 'system_config_cache';
const CONFIG_VERSION_KEY = 'system_config_version';

export const ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [rawConfigs, setRawConfigs] = useState<SystemConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [configVersion, setConfigVersion] = useState(0);

    // Parse raw configs into typed AppConfig
    const config = useMemo((): AppConfig => {
        if (rawConfigs.length === 0) {
            return DEFAULT_CONFIG;
        }

        const getValue = (category: string, key: string, defaultValue: any): any => {
            const cfg = rawConfigs.find(c => c.category === category && c.key === key);
            if (!cfg) return defaultValue;
            
            // Parse based on type
            if (cfg.type === 'boolean') return cfg.value === 'true';
            if (cfg.type === 'number') return parseInt(cfg.value, 10) || defaultValue;
            return cfg.value || defaultValue;
        };

        return {
            auth: {
                sessionTimeout: getValue('auth', 'session_timeout', DEFAULT_CONFIG.auth.sessionTimeout),
                maxLoginAttempts: getValue('auth', 'max_login_attempts', DEFAULT_CONFIG.auth.maxLoginAttempts),
                lockoutDuration: getValue('auth', 'lockout_duration', DEFAULT_CONFIG.auth.lockoutDuration),
                passwordMinLength: getValue('auth', 'password_min_length', DEFAULT_CONFIG.auth.passwordMinLength),
                requireMfa: getValue('auth', 'require_mfa', DEFAULT_CONFIG.auth.requireMfa),
            },
            users: {
                defaultRole: getValue('users', 'default_user_role', DEFAULT_CONFIG.users.defaultRole),
                requireEmailVerification: getValue('users', 'require_email_verification', DEFAULT_CONFIG.users.requireEmailVerification),
                allowSelfRegistration: getValue('users', 'allow_self_registration', DEFAULT_CONFIG.users.allowSelfRegistration),
            },
            notifications: {
                emailEnabled: getValue('notifications', 'email_enabled', DEFAULT_CONFIG.notifications.emailEnabled),
                smsEnabled: getValue('notifications', 'sms_enabled', DEFAULT_CONFIG.notifications.smsEnabled),
                inAppEnabled: getValue('notifications', 'in_app_enabled', DEFAULT_CONFIG.notifications.inAppEnabled),
                digestFrequency: getValue('notifications', 'digest_frequency', DEFAULT_CONFIG.notifications.digestFrequency),
            },
            ticketing: {
                autoAssign: getValue('ticketing', 'auto_assign', DEFAULT_CONFIG.ticketing.autoAssign),
                defaultPriority: getValue('ticketing', 'default_priority', DEFAULT_CONFIG.ticketing.defaultPriority),
                escalationHours: getValue('ticketing', 'escalation_hours', DEFAULT_CONFIG.ticketing.escalationHours),
                autoCloseAfterDays: getValue('ticketing', 'auto_close_days', DEFAULT_CONFIG.ticketing.autoCloseAfterDays),
            },
            ui: {
                defaultTheme: getValue('ui', 'default_theme', DEFAULT_CONFIG.ui.defaultTheme) as 'light' | 'dark' | 'system',
                defaultLanguage: getValue('ui', 'default_language', DEFAULT_CONFIG.ui.defaultLanguage),
                dateFormat: getValue('ui', 'date_format', DEFAULT_CONFIG.ui.dateFormat),
                timeFormat: getValue('ui', 'time_format', DEFAULT_CONFIG.ui.timeFormat),
            },
            analytics: {
                dataRetentionDays: getValue('analytics', 'data_retention_days', DEFAULT_CONFIG.analytics.dataRetentionDays),
                defaultExportFormat: getValue('analytics', 'default_export_format', DEFAULT_CONFIG.analytics.defaultExportFormat),
            },
            features: {
                expertApplications: getValue('features', 'expert_applications', DEFAULT_CONFIG.features.expertApplications),
                connectRequests: getValue('features', 'connect_requests', DEFAULT_CONFIG.features.connectRequests),
                liveChat: getValue('features', 'live_chat', DEFAULT_CONFIG.features.liveChat),
                videoSessions: getValue('features', 'video_sessions', DEFAULT_CONFIG.features.videoSessions),
            },
        };
    }, [rawConfigs]);

    // Fetch configs from server
    const fetchConfigs = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // First, try to load from cache for immediate display
            const cached = localStorage.getItem(CONFIG_CACHE_KEY);
            if (cached) {
                try {
                    const parsedCache = JSON.parse(cached);
                    if (parsedCache.configs && Array.isArray(parsedCache.configs)) {
                        setRawConfigs(parsedCache.configs);
                    }
                } catch (e) {
                    // Invalid cache, ignore
                }
            }

            // Fetch fresh configs from server (public endpoint for basic UI configs)
            const response = await axios.get('/api/config/public');
            
            if (response.data.success && response.data.data) {
                const configs = response.data.data;
                setRawConfigs(configs);
                setLastUpdated(new Date());
                setConfigVersion(prev => prev + 1);

                // Update cache
                localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify({
                    configs,
                    timestamp: Date.now()
                }));
                localStorage.setItem(CONFIG_VERSION_KEY, String(Date.now()));
            }
        } catch (err: any) {
            // If fetch fails, continue with cached/default values
            console.warn('Failed to fetch system config, using defaults:', err.message);
            if (rawConfigs.length === 0) {
                // No cache available, use defaults (don't set error for non-critical failure)
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Refresh configs (public method for force refresh)
    const refreshConfig = useCallback(async () => {
        await fetchConfigs();
    }, [fetchConfigs]);

    // Get a specific config value
    const getConfigValue = useCallback((category: string, key: string): string | undefined => {
        const cfg = rawConfigs.find(c => c.category === category && c.key === key);
        return cfg?.value;
    }, [rawConfigs]);

    // Check if a feature is enabled
    const isFeatureEnabled = useCallback((featureKey: string): boolean => {
        const cfg = rawConfigs.find(c => c.category === 'features' && c.key === featureKey);
        return cfg?.value === 'true';
    }, [rawConfigs]);

    // Initial fetch
    useEffect(() => {
        fetchConfigs();
    }, [fetchConfigs]);

    // Listen for config update events (cross-tab communication)
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === CONFIG_VERSION_KEY && e.newValue) {
                // Config was updated in another tab, refresh
                fetchConfigs();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [fetchConfigs]);

    // Poll for updates periodically (every 5 minutes)
    useEffect(() => {
        const interval = setInterval(() => {
            fetchConfigs();
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [fetchConfigs]);

    const value: ConfigContextType = {
        rawConfigs,
        config,
        isLoading,
        error,
        refreshConfig,
        getConfigValue,
        isFeatureEnabled,
        lastUpdated,
        configVersion,
    };

    return (
        <ConfigContext.Provider value={value}>
            {children}
        </ConfigContext.Provider>
    );
};

// Hook to use config context
export const useConfig = (): ConfigContextType => {
    const context = useContext(ConfigContext);
    if (!context) {
        throw new Error('useConfig must be used within a ConfigProvider');
    }
    return context;
};

// Hook to get typed config values
export const useAppConfig = (): AppConfig => {
    const { config } = useConfig();
    return config;
};

// Hook to check feature flags
export const useFeatureFlag = (featureKey: string): boolean => {
    const { isFeatureEnabled } = useConfig();
    return isFeatureEnabled(featureKey);
};

// Utility to broadcast config update across tabs
export const broadcastConfigUpdate = (): void => {
    localStorage.setItem(CONFIG_VERSION_KEY, String(Date.now()));
};
