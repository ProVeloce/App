import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo, useRef } from 'react';
import axios from 'axios';
import { setTimeFormat } from '../utils/dateUtils';

// System configuration interface (from system_config table)
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

// Live configuration interface (from configuration table)
export interface LiveConfig {
    config_id: number;
    config_key: string;
    config_value: string;
    updated_by: number;
    updated_at: string;
}

// Typed configuration values
export interface AppConfig {
    // System / Maintenance
    system: {
        maintenanceMode: boolean;
        maintenanceMessage: string;
        maintenanceEndTime: string | null;
    };
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
    system: {
        maintenanceMode: false,
        maintenanceMessage: 'System is currently under maintenance. Please check back later.',
        maintenanceEndTime: null,
    },
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
        timeFormat: '24h',
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
    // Raw configs from database (system_config table)
    rawConfigs: SystemConfig[];
    // Live configs from configuration table (simple key-value)
    liveConfig: Record<string, string>;
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
    // Get a live config value (from configuration table)
    getLiveConfigValue: (key: string) => string | undefined;
    // Check if a feature is enabled
    isFeatureEnabled: (featureKey: string) => boolean;
    // Last updated timestamp
    lastUpdated: Date | null;
    // Version for cache invalidation
    configVersion: number;
    // Live polling active status
    isPolling: boolean;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

// Local storage key for caching
const CONFIG_CACHE_KEY = 'system_config_cache';
const CONFIG_VERSION_KEY = 'system_config_version';

// Polling interval in milliseconds (1 second for live updates)
const POLLING_INTERVAL = 1000;

export const ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [rawConfigs, setRawConfigs] = useState<SystemConfig[]>([]);
    const [liveConfig, setLiveConfig] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [configVersion, setConfigVersion] = useState(0);
    const [isPolling, setIsPolling] = useState(false);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastConfigHashRef = useRef<string>('');

    // Parse raw configs into typed AppConfig
    const config = useMemo((): AppConfig => {
        if (rawConfigs.length === 0 && Object.keys(liveConfig).length === 0) {
            return DEFAULT_CONFIG;
        }

        // Helper to get value from system_config table
        const getSystemValue = (category: string, key: string, defaultValue: any): any => {
            const cfg = rawConfigs.find(c => c.category === category && c.key === key);
            if (!cfg) return defaultValue;
            
            // Parse based on type
            if (cfg.type === 'boolean') return cfg.value === 'true';
            if (cfg.type === 'number') return parseInt(cfg.value, 10) || defaultValue;
            return cfg.value || defaultValue;
        };

        // Helper to parse live config values with type coercion
        const parseLiveValue = (value: string | undefined, defaultValue: any): any => {
            if (value === undefined) return defaultValue;
            // Auto-parse boolean strings
            if (value === 'true') return true;
            if (value === 'false') return false;
            // Auto-parse numbers (only if purely numeric)
            const num = parseInt(value, 10);
            if (!isNaN(num) && String(num) === value) return num;
            return value;
        };

        // Universal getValue that checks liveConfig first (real-time), then system_config (database)
        // This gives Superadmin real-time control over ALL settings
        const getValue = (category: string, key: string, defaultValue: any): any => {
            // Check live config with category.key format first (highest priority)
            const fullKey = `${category}.${key}`;
            if (liveConfig[fullKey] !== undefined) {
                return parseLiveValue(liveConfig[fullKey], defaultValue);
            }
            // Check live config with just key (for backward compatibility)
            if (liveConfig[key] !== undefined) {
                return parseLiveValue(liveConfig[key], defaultValue);
            }
            // Fall back to system_config table
            return getSystemValue(category, key, defaultValue);
        };

        // Check for maintenance mode in multiple sources
        // Supports both 'true'/'false' and 'ENABLED'/'DISABLED' values
        const maintenanceFromLive = liveConfig['maintenance_mode'] ?? liveConfig['system.maintenance_mode'];
        const maintenanceFromSystem = rawConfigs.find(c => c.category === 'system' && c.key === 'maintenance_mode');
        const maintenanceModeValue = maintenanceFromLive ?? maintenanceFromSystem?.value ?? 'false';
        
        // Check if maintenance is enabled (supports multiple value formats)
        const isMaintenanceEnabled = 
            String(maintenanceModeValue).toLowerCase() === 'true' || 
            String(maintenanceModeValue).toUpperCase() === 'ENABLED';

        return {
            // System & Maintenance
            system: {
                maintenanceMode: isMaintenanceEnabled,
                maintenanceMessage: getValue('system', 'maintenance_message', DEFAULT_CONFIG.system.maintenanceMessage),
                maintenanceEndTime: getValue('system', 'maintenance_end_time', DEFAULT_CONFIG.system.maintenanceEndTime) || null,
            },
            // Authentication & Security
            auth: {
                sessionTimeout: getValue('auth', 'session_timeout', DEFAULT_CONFIG.auth.sessionTimeout),
                maxLoginAttempts: getValue('auth', 'max_login_attempts', DEFAULT_CONFIG.auth.maxLoginAttempts),
                lockoutDuration: getValue('auth', 'lockout_duration', DEFAULT_CONFIG.auth.lockoutDuration),
                passwordMinLength: getValue('auth', 'password_min_length', DEFAULT_CONFIG.auth.passwordMinLength),
                requireMfa: getValue('auth', 'require_mfa', DEFAULT_CONFIG.auth.requireMfa),
            },
            // User Management
            users: {
                defaultRole: getValue('users', 'default_user_role', DEFAULT_CONFIG.users.defaultRole),
                requireEmailVerification: getValue('users', 'require_email_verification', DEFAULT_CONFIG.users.requireEmailVerification),
                allowSelfRegistration: getValue('users', 'allow_self_registration', DEFAULT_CONFIG.users.allowSelfRegistration),
            },
            // Notifications
            notifications: {
                emailEnabled: getValue('notifications', 'email_enabled', DEFAULT_CONFIG.notifications.emailEnabled),
                smsEnabled: getValue('notifications', 'sms_enabled', DEFAULT_CONFIG.notifications.smsEnabled),
                inAppEnabled: getValue('notifications', 'in_app_enabled', DEFAULT_CONFIG.notifications.inAppEnabled),
                digestFrequency: getValue('notifications', 'digest_frequency', DEFAULT_CONFIG.notifications.digestFrequency),
            },
            // Help Desk & Ticketing
            ticketing: {
                autoAssign: getValue('ticketing', 'auto_assign', DEFAULT_CONFIG.ticketing.autoAssign),
                defaultPriority: getValue('ticketing', 'default_priority', DEFAULT_CONFIG.ticketing.defaultPriority),
                escalationHours: getValue('ticketing', 'escalation_hours', DEFAULT_CONFIG.ticketing.escalationHours),
                autoCloseAfterDays: getValue('ticketing', 'auto_close_days', DEFAULT_CONFIG.ticketing.autoCloseAfterDays),
            },
            // UI/UX Preferences
            ui: {
                defaultTheme: getValue('ui', 'default_theme', DEFAULT_CONFIG.ui.defaultTheme) as 'light' | 'dark' | 'system',
                defaultLanguage: getValue('ui', 'default_language', DEFAULT_CONFIG.ui.defaultLanguage),
                dateFormat: getValue('ui', 'date_format', DEFAULT_CONFIG.ui.dateFormat),
                timeFormat: getValue('ui', 'time_format', DEFAULT_CONFIG.ui.timeFormat),
            },
            // Analytics & Reporting
            analytics: {
                dataRetentionDays: getValue('analytics', 'data_retention_days', DEFAULT_CONFIG.analytics.dataRetentionDays),
                defaultExportFormat: getValue('analytics', 'default_export_format', DEFAULT_CONFIG.analytics.defaultExportFormat),
            },
            // Feature Toggles
            features: {
                expertApplications: getValue('features', 'expert_applications', DEFAULT_CONFIG.features.expertApplications),
                connectRequests: getValue('features', 'connect_requests', DEFAULT_CONFIG.features.connectRequests),
                liveChat: getValue('features', 'live_chat', DEFAULT_CONFIG.features.liveChat),
                videoSessions: getValue('features', 'video_sessions', DEFAULT_CONFIG.features.videoSessions),
            },
        };
    }, [rawConfigs, liveConfig]);

    // Fetch configs from server (initial load)
    const fetchConfigs = useCallback(async (isPollingRequest = false) => {
        if (!isPollingRequest) {
            setIsLoading(true);
            setError(null);
        }

        try {
            // First, try to load from cache for immediate display (only on initial load)
            if (!isPollingRequest) {
                const cached = localStorage.getItem(CONFIG_CACHE_KEY);
                if (cached) {
                    try {
                        const parsedCache = JSON.parse(cached);
                        if (parsedCache.configs && Array.isArray(parsedCache.configs)) {
                            setRawConfigs(parsedCache.configs);
                        }
                        if (parsedCache.liveConfig) {
                            setLiveConfig(parsedCache.liveConfig);
                        }
                    } catch (e) {
                        // Invalid cache, ignore
                    }
                }
            }

            // Fetch fresh configs from server (public endpoint for basic UI configs)
            const response = await axios.get('/api/config/public');
            
            if (response.data.success) {
                const configs = response.data.data || [];
                const newLiveConfig = response.data.liveConfig || {};

                // Create a hash of the config to detect changes
                const newHash = JSON.stringify({ configs, liveConfig: newLiveConfig });
                
                // Only update if there are actual changes (to prevent unnecessary re-renders)
                if (newHash !== lastConfigHashRef.current) {
                    lastConfigHashRef.current = newHash;
                    setRawConfigs(configs);
                    setLiveConfig(newLiveConfig);
                    setLastUpdated(new Date());
                    setConfigVersion(prev => prev + 1);

                    // Update cache
                    localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify({
                        configs,
                        liveConfig: newLiveConfig,
                        timestamp: Date.now()
                    }));
                    localStorage.setItem(CONFIG_VERSION_KEY, String(Date.now()));
                }
            }
        } catch (err: any) {
            // If fetch fails, continue with cached/default values
            if (!isPollingRequest) {
                console.warn('Failed to fetch system config, using defaults:', err.message);
            }
        } finally {
            if (!isPollingRequest) {
                setIsLoading(false);
            }
        }
    }, []);

    // Use ref to track last config hash to avoid stale closure issues
    const liveConfigRef = useRef<Record<string, string>>({});
    
    // Keep ref in sync with state
    useEffect(() => {
        liveConfigRef.current = liveConfig;
    }, [liveConfig]);

    // Lightweight polling function for live config updates
    const pollLiveConfig = useCallback(async () => {
        try {
            const response = await axios.get('/api/configuration', {
                timeout: 5000 // 5 second timeout for polling requests
            });
            
            if (response.data.success && response.data.config) {
                const newLiveConfig = response.data.config;
                
                // Create hash to detect changes using ref (avoids stale closure)
                const newHash = JSON.stringify(newLiveConfig);
                const oldHash = JSON.stringify(liveConfigRef.current);
                
                if (newHash !== oldHash) {
                    console.log('[Config Polling] Changes detected, updating live config');
                    setLiveConfig(newLiveConfig);
                    setLastUpdated(new Date());
                    setConfigVersion(prev => prev + 1);
                    
                    // Update cache with new live config
                    const cached = localStorage.getItem(CONFIG_CACHE_KEY);
                    if (cached) {
                        try {
                            const parsedCache = JSON.parse(cached);
                            parsedCache.liveConfig = newLiveConfig;
                            parsedCache.timestamp = Date.now();
                            localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(parsedCache));
                        } catch (e) {
                            // Ignore cache update errors
                        }
                    }
                }
            }
        } catch (err) {
            // Silently fail polling - don't disturb user experience
            console.warn('[Config Polling] Request failed:', err);
        }
    }, []); // No dependencies - uses refs for latest state

    // Refresh configs (public method for force refresh)
    const refreshConfig = useCallback(async () => {
        await fetchConfigs(false);
    }, [fetchConfigs]);

    // Get a specific config value from system_config
    const getConfigValue = useCallback((category: string, key: string): string | undefined => {
        const cfg = rawConfigs.find(c => c.category === category && c.key === key);
        return cfg?.value;
    }, [rawConfigs]);

    // Get a live config value from configuration table
    const getLiveConfigValue = useCallback((key: string): string | undefined => {
        return liveConfig[key];
    }, [liveConfig]);

    // Check if a feature is enabled (checks both live config and system_config)
    const isFeatureEnabled = useCallback((featureKey: string): boolean => {
        // First check live config
        if (liveConfig[featureKey] !== undefined) {
            return liveConfig[featureKey] === 'true';
        }
        // Fall back to system_config
        const cfg = rawConfigs.find(c => c.category === 'features' && c.key === featureKey);
        return cfg?.value === 'true';
    }, [rawConfigs, liveConfig]);

    // Initial fetch
    useEffect(() => {
        fetchConfigs(false);
    }, [fetchConfigs]);

    // Listen for config update events (cross-tab communication)
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === CONFIG_VERSION_KEY && e.newValue) {
                // Config was updated in another tab, refresh
                fetchConfigs(false);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [fetchConfigs]);

    // Live polling for configuration updates (every 1 second)
    useEffect(() => {
        console.log('[Config Polling] Starting live config polling (1 second interval)');
        
        // Start polling
        setIsPolling(true);
        
        // Immediately poll once on mount
        pollLiveConfig();
        
        // Then poll every POLLING_INTERVAL
        pollingIntervalRef.current = setInterval(() => {
            pollLiveConfig();
        }, POLLING_INTERVAL);

        return () => {
            console.log('[Config Polling] Stopping live config polling');
            setIsPolling(false);
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        };
    }, [pollLiveConfig]);

    // Also fetch full configs periodically (every 5 minutes) for system_config updates
    useEffect(() => {
        const interval = setInterval(() => {
            fetchConfigs(true);
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [fetchConfigs]);

    // Sync time format to dateUtils when config changes
    useEffect(() => {
        const timeFormat = config.ui.timeFormat;
        if (timeFormat === '12h' || timeFormat === '24h') {
            setTimeFormat(timeFormat);
        }
    }, [config.ui.timeFormat]);

    const value: ConfigContextType = {
        rawConfigs,
        liveConfig,
        config,
        isLoading,
        error,
        refreshConfig,
        getConfigValue,
        getLiveConfigValue,
        isFeatureEnabled,
        lastUpdated,
        configVersion,
        isPolling,
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

// Hook to check if maintenance mode is enabled
export const useMaintenanceMode = (): { isMaintenanceMode: boolean; message: string; endTime: string | null } => {
    const { config } = useConfig();
    return {
        isMaintenanceMode: config.system.maintenanceMode,
        message: config.system.maintenanceMessage,
        endTime: config.system.maintenanceEndTime,
    };
};

// Utility to broadcast config update across tabs
export const broadcastConfigUpdate = (): void => {
    localStorage.setItem(CONFIG_VERSION_KEY, String(Date.now()));
};

// =====================================================
// Feature Enforcement Hooks
// =====================================================

// Hook to check if certifications are enabled
export const useCertificationsEnabled = (): boolean => {
    const { getLiveConfigValue, getConfigValue } = useConfig();
    const value = getLiveConfigValue('certifications_enabled') || 
                 getLiveConfigValue('features.certifications_enabled') ||
                 getConfigValue('features', 'certifications_enabled') ||
                 'true';
    return value === 'true' || value === 'ENABLED';
};

// Hook to check if social login is enabled
export const useSocialLoginEnabled = (): boolean => {
    const { getLiveConfigValue, getConfigValue } = useConfig();
    const value = getLiveConfigValue('allow_social_login') || 
                 getLiveConfigValue('auth.allow_social_login') ||
                 getConfigValue('auth', 'allow_social_login') ||
                 'true';
    return value === 'true' || value === 'ENABLED';
};

// Hook to check if 2FA is required
export const use2FARequired = (): boolean => {
    const { getLiveConfigValue, getConfigValue, config } = useConfig();
    const value = getLiveConfigValue('require_2FA') || 
                 getLiveConfigValue('require_mfa') ||
                 getLiveConfigValue('auth.require_2FA') ||
                 getConfigValue('auth', 'require_mfa') ||
                 String(config.auth.requireMfa);
    return value === 'true' || value === 'ENABLED';
};

// Hook to check if SMS notifications are enabled
export const useSMSEnabled = (): boolean => {
    const { getLiveConfigValue, getConfigValue, config } = useConfig();
    const value = getLiveConfigValue('sms_enabled') || 
                 getLiveConfigValue('notifications.sms_enabled') ||
                 getConfigValue('notifications', 'sms_enabled') ||
                 String(config.notifications.smsEnabled);
    return value === 'true' || value === 'ENABLED';
};

// Hook to check if messaging is enabled
export const useMessagingEnabled = (): boolean => {
    const { getLiveConfigValue, getConfigValue, config } = useConfig();
    const value = getLiveConfigValue('messaging_enabled') || 
                 getLiveConfigValue('feature.messaging') ||
                 getLiveConfigValue('features.messaging_enabled') ||
                 getConfigValue('features', 'messaging_enabled') ||
                 'true';
    return value === 'true' || value === 'ENABLED';
};

// Hook to get time format (12h or 24h)
export const useTimeFormat = (): '12h' | '24h' => {
    const { getLiveConfigValue, getConfigValue, config } = useConfig();
    const value = getLiveConfigValue('time_format') || 
                 getLiveConfigValue('ui.time_format') ||
                 getConfigValue('ui', 'time_format') ||
                 config.ui.timeFormat ||
                 '24h';
    return (value === '12h' || value === '12-hour') ? '12h' : '24h';
};

// Hook to check if analytics real-time is enabled
export const useAnalyticsRealTime = (): boolean => {
    const { getLiveConfigValue, getConfigValue } = useConfig();
    const value = getLiveConfigValue('analytics.real_time') || 
                 getLiveConfigValue('analytics_real_time') ||
                 getConfigValue('analytics', 'real_time') ||
                 'false';
    return value === 'true' || value === 'ENABLED';
};
