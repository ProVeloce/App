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

// Default configuration values (ONLY for app crash prevention - NOT for production use)
// PRODUCTION RULE: Backend MUST auto-seed configuration table, so DEFAULT_CONFIG should NEVER be used
// All configuration values MUST be stored in and fetched from the database tables:
// - system_config table: Full config details (labels, descriptions, types)
// - configuration table: Simple key-value pairs for live polling (SINGLE SOURCE OF TRUTH)
// localStorage is ONLY used for caching to improve performance, never as primary source
// If DEFAULT_CONFIG is used, it indicates a critical backend failure
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
    // Live configs from configuration table (can be flat or nested objects)
    liveConfig: Record<string, any>;
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
    // Priority: liveConfig (from configuration table) > rawConfigs (from system_config table) > DEFAULT_CONFIG (fallback only)
    // DEFAULT_CONFIG is ONLY used as a last resort when API completely fails - NOT for empty DB
    // Empty DB should trigger auto-seeding on backend, so empty config indicates API failure
    const config = useMemo((): AppConfig => {
        // PRODUCTION RULE: If both sources are empty, this is a CRITICAL ERROR
        // Backend MUST auto-seed configuration table, so empty config = backend failure
        // DEFAULT_CONFIG is ONLY used to prevent app crash - this should NEVER happen in production
        if (rawConfigs.length === 0 && Object.keys(liveConfig).length === 0) {
            // Log as CRITICAL ERROR - backend is not seeding or API is completely down
            console.error('[ConfigContext] CRITICAL ERROR: Both config sources are empty - backend may have failed to seed or API is down');
            console.error('[ConfigContext] This should NEVER happen in production - backend MUST auto-seed configuration table');
            // Return DEFAULT_CONFIG ONLY to prevent app crash - this is a critical error state
            // Frontend error state is already set by fetchConfigs, so user will see error message
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

        // Check for maintenance mode - supports structured config (maintenance_mode) and nested (system.maintenance_mode)
        // Supports both 'true'/'false' and 'ENABLED'/'DISABLED' values
        const maintenanceFromLive = liveConfig['maintenance_mode'] ?? 
                                    (typeof liveConfig['system'] === 'object' && liveConfig['system'] !== null ? liveConfig['system']['maintenance_mode'] : undefined);
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
            // Notifications - support structured config (notifications.sms, notifications.email)
            notifications: {
                emailEnabled: (typeof liveConfig['notifications'] === 'object' && liveConfig['notifications'] !== null && liveConfig['notifications']['email'] === 'ENABLED') || getValue('notifications', 'email_enabled', DEFAULT_CONFIG.notifications.emailEnabled),
                smsEnabled: (typeof liveConfig['notifications'] === 'object' && liveConfig['notifications'] !== null && liveConfig['notifications']['sms'] === 'ENABLED') || getValue('notifications', 'sms_enabled', DEFAULT_CONFIG.notifications.smsEnabled),
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
            // UI/UX Preferences - support structured config (ui.time_format, ui.theme)
            ui: {
                defaultTheme: ((typeof liveConfig['ui'] === 'object' && liveConfig['ui'] !== null && liveConfig['ui']['theme']) || getValue('ui', 'default_theme', DEFAULT_CONFIG.ui.defaultTheme)) as 'light' | 'dark' | 'system',
                defaultLanguage: getValue('ui', 'default_language', DEFAULT_CONFIG.ui.defaultLanguage),
                dateFormat: getValue('ui', 'date_format', DEFAULT_CONFIG.ui.dateFormat),
                timeFormat: (typeof liveConfig['ui'] === 'object' && liveConfig['ui'] !== null && liveConfig['ui']['time_format']) || getValue('ui', 'time_format', DEFAULT_CONFIG.ui.timeFormat),
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
            // NOTE: localStorage is ONLY for caching to improve UX, NOT a primary data source
            // All data MUST come from database via API calls
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

            // ALWAYS fetch fresh configs from database (public endpoint for basic UI configs)
            // This ensures we always have the latest data from the database
            // Backend auto-seeds if empty, so this should NEVER return empty
            const response = await axios.get('/api/config/public', {
                timeout: 5000, // 5 second timeout
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            
            // Handle both success: true and success: false cases
            // Backend should always return liveConfig even on errors (with hardcoded defaults)
            if (response.data) {
                const configs = response.data.data || [];
                const newLiveConfig = response.data.liveConfig || {};

                // Check if backend returned an error
                if (response.data.success === false && response.data.error) {
                    // Backend error, but check if liveConfig was still provided
                    if (Object.keys(newLiveConfig).length === 0) {
                        throw new Error(`Configuration API error: ${response.data.error}`);
                    }
                    // If liveConfig exists, use it even if success is false
                    console.warn('[ConfigContext] Backend returned error but provided liveConfig:', response.data.error);
                }

                // Validate that we received actual config data
                // Backend should auto-seed, so empty config indicates critical backend failure
                // However, backend now returns hardcoded defaults as last resort, so this should rarely happen
                if (configs.length === 0 && Object.keys(newLiveConfig).length === 0) {
                    throw new Error('Configuration API returned empty data - backend may not be seeding defaults');
                }
                
                // Even if system_config is empty, liveConfig from configuration table should have data
                // If liveConfig is empty, backend seeding failed (but backend should return hardcoded defaults)
                if (Object.keys(newLiveConfig).length === 0) {
                    console.error('[ConfigContext] CRITICAL: liveConfig is empty - backend seeding may have failed');
                    throw new Error('Configuration table is empty - backend auto-seeding may have failed');
                }
                
                // If we have liveConfig, proceed (even if system_config is empty)
                // liveConfig is the primary source of truth

                // Create a hash of the config to detect changes
                const newHash = JSON.stringify({ configs, liveConfig: newLiveConfig });
                
                // Only update if there are actual changes (to prevent unnecessary re-renders)
                if (newHash !== lastConfigHashRef.current) {
                    lastConfigHashRef.current = newHash;
                    setRawConfigs(configs);
                    setLiveConfig(newLiveConfig);
                    setLastUpdated(new Date());
                    setConfigVersion(prev => prev + 1);
                    setError(null); // Clear any previous errors

                    // Update cache
                    localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify({
                        configs,
                        liveConfig: newLiveConfig,
                        timestamp: Date.now()
                    }));
                    localStorage.setItem(CONFIG_VERSION_KEY, String(Date.now()));
                }
            } else {
                throw new Error(response.data.error || 'Failed to fetch configurations');
            }
        } catch (err: any) {
            // Set error state - do NOT silently fallback
            const errorMessage = err.response?.data?.error || err.message || 'Failed to load configurations';
            
            // Check if it's a network error (CORS, timeout, connection refused)
            const isNetworkError = !err.response && (err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK' || err.message?.includes('fetch'));
            
            if (!isPollingRequest) {
                // Only set error on initial load, not during polling
                if (isNetworkError) {
                    setError('Unable to connect to configuration service. Please check your connection and try again.');
                } else {
                    setError(errorMessage);
                }
                console.error('[ConfigContext] Failed to fetch configurations:', errorMessage, err);
            } else {
                // During polling, log but don't set error (to avoid UI disruption)
                // Network errors during polling are expected (temporary disconnections)
                if (!isNetworkError) {
                    console.warn('[Config Polling] Failed to fetch config:', errorMessage);
                }
            }
        } finally {
            if (!isPollingRequest) {
                setIsLoading(false);
            }
        }
    }, []);

    // Use ref to track last config hash to avoid stale closure issues
    const liveConfigRef = useRef<Record<string, any>>({});
    
    // Keep ref in sync with state
    useEffect(() => {
        liveConfigRef.current = liveConfig;
    }, [liveConfig]);

    // Real-time polling function - fetches /api/config every 1 second
    // NO CACHING - always fetches live from database
    // Backend auto-seeds if empty, so this should NEVER return empty
    const pollLiveConfig = useCallback(async () => {
        try {
            const response = await axios.get('/api/config', {
                timeout: 3000, // 3 second timeout for polling requests
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            
            // Response is the structured config object directly (not wrapped in success/data)
            // Backend should NEVER return empty - it auto-seeds if table is empty
            const newLiveConfig = response.data || {};
            
            // Validate that we received actual config data
            // If backend returns empty, it means seeding failed (critical error)
            if (Object.keys(newLiveConfig).length === 0) {
                // Check if backend returned an error object
                if (response.data && response.data.error) {
                    console.error('[Config Polling] ERROR: Backend returned error:', response.data.error);
                } else {
                    console.error('[Config Polling] ERROR: Received empty config - backend should auto-seed');
                }
                // Don't update state with empty config - keep existing config
                // This prevents overwriting valid config with empty data
                return;
            }
            
            // Validate that we have at least some required keys (basic sanity check)
            const requiredKeys = ['maintenance_mode', 'certifications', 'require_2FA'];
            const hasRequiredKeys = requiredKeys.some(key => newLiveConfig[key] !== undefined);
            if (!hasRequiredKeys && Object.keys(newLiveConfig).length < 5) {
                console.warn('[Config Polling] WARNING: Config missing required keys - may be incomplete');
                // Still update, but log warning
            }
            
            // Create hash to detect changes using ref (avoids stale closure)
            const newHash = JSON.stringify(newLiveConfig);
            const oldHash = JSON.stringify(liveConfigRef.current);
            
            if (newHash !== oldHash) {
                console.log('[Config Polling] Changes detected, applying live config updates');
                setLiveConfig(newLiveConfig);
                setLastUpdated(new Date());
                setConfigVersion(prev => prev + 1);
                setError(null); // Clear error if config loads successfully
                
                // Update cache (for initial load only, not primary source)
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
        } catch (err: any) {
            // Log polling failures but don't disrupt UI
            // If initial load failed, error state is already set
            const errorMessage = err.response?.data?.error || err.message;
            console.warn('[Config Polling] Request failed:', errorMessage);
            // Don't set error state during polling to avoid UI disruption
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
// Feature Enforcement Hooks (Real-time from /api/config)
// =====================================================
// These hooks read from liveConfig which is polled every 1 second
// Changes are applied instantly without page refresh

// Hook to check if certifications are enabled (supports both flat and nested config)
export const useCertificationsEnabled = (): boolean => {
    const { liveConfig, getLiveConfigValue, getConfigValue } = useConfig();
    // Check structured config first (certifications: "ENABLED")
    const structuredValue = liveConfig['certifications'];
    // Check flat keys
    const flatValue = getLiveConfigValue('certifications_enabled') || 
                     getLiveConfigValue('features.certifications_enabled');
    // Fall back to system_config
    const systemValue = getConfigValue('features', 'certifications_enabled');
    
    const value = structuredValue || flatValue || systemValue || 'ENABLED';
    return value === 'true' || value === 'ENABLED';
};

// Hook to check if social login is enabled
export const useSocialLoginEnabled = (): boolean => {
    const { liveConfig, getLiveConfigValue, getConfigValue } = useConfig();
    const structuredValue = (typeof liveConfig['auth'] === 'object' && liveConfig['auth'] !== null) ? liveConfig['auth']['allow_social_login'] : undefined;
    const flatValue = getLiveConfigValue('allow_social_login') || 
                     getLiveConfigValue('auth.allow_social_login');
    const systemValue = getConfigValue('auth', 'allow_social_login');
    
    const value = structuredValue || flatValue || systemValue || 'ENABLED';
    return value === 'true' || value === 'ENABLED';
};

// Hook to check if 2FA is required
export const use2FARequired = (): boolean => {
    const { liveConfig, getLiveConfigValue, getConfigValue, config } = useConfig();
    const structuredValue = liveConfig['require_2FA'];
    const flatValue = getLiveConfigValue('require_2FA') || 
                     getLiveConfigValue('require_mfa') ||
                     getLiveConfigValue('auth.require_2FA');
    const systemValue = getConfigValue('auth', 'require_mfa') || String(config.auth.requireMfa);
    
    const value = structuredValue || flatValue || systemValue || 'DISABLED';
    return value === 'true' || value === 'ENABLED';
};

// Hook to check if SMS notifications are enabled
export const useSMSEnabled = (): boolean => {
    const { liveConfig, getLiveConfigValue, getConfigValue, config } = useConfig();
    // Check structured config (notifications: { sms: "ENABLED" })
    const structuredValue = (typeof liveConfig['notifications'] === 'object' && liveConfig['notifications'] !== null) ? liveConfig['notifications']['sms'] : undefined;
    const flatValue = getLiveConfigValue('notifications.sms') ||
                     getLiveConfigValue('sms_enabled') || 
                     getLiveConfigValue('notifications.sms_enabled');
    const systemValue = getConfigValue('notifications', 'sms_enabled') || String(config.notifications.smsEnabled);
    
    const value = structuredValue || flatValue || systemValue || 'DISABLED';
    return value === 'true' || value === 'ENABLED';
};

// Hook to check if messaging is enabled
export const useMessagingEnabled = (): boolean => {
    const { liveConfig, getLiveConfigValue, getConfigValue } = useConfig();
    const structuredValue = liveConfig['messaging_enabled'] || 
                           (typeof liveConfig['features'] === 'object' && liveConfig['features'] !== null ? liveConfig['features']['messaging'] : undefined);
    const flatValue = getLiveConfigValue('messaging_enabled') || 
                     getLiveConfigValue('feature.messaging') ||
                     getLiveConfigValue('features.messaging_enabled');
    const systemValue = getConfigValue('features', 'messaging_enabled');
    
    const value = structuredValue || flatValue || systemValue || 'ENABLED';
    return value === 'true' || value === 'ENABLED';
};

// Hook to get time format (12h or 24h) - supports structured config (ui.time_format)
export const useTimeFormat = (): '12h' | '24h' => {
    const { liveConfig, getLiveConfigValue, getConfigValue, config } = useConfig();
    // Check structured config (ui: { time_format: "24-hour" })
    const structuredValue = (typeof liveConfig['ui'] === 'object' && liveConfig['ui'] !== null) ? liveConfig['ui']['time_format'] : undefined;
    const flatValue = getLiveConfigValue('time_format') || 
                     getLiveConfigValue('ui.time_format');
    const systemValue = getConfigValue('ui', 'time_format') || config.ui.timeFormat || '24h';
    
    const value = structuredValue || flatValue || systemValue || '24h';
    return (value === '12h' || value === '12-hour') ? '12h' : '24h';
};

// Hook to check if analytics real-time is enabled
export const useAnalyticsRealTime = (): boolean => {
    const { liveConfig, getLiveConfigValue, getConfigValue } = useConfig();
    const structuredValue = (typeof liveConfig['analytics'] === 'object' && liveConfig['analytics'] !== null) ? liveConfig['analytics']['real_time'] : undefined;
    const flatValue = getLiveConfigValue('analytics.real_time') || 
                     getLiveConfigValue('analytics_real_time');
    const systemValue = getConfigValue('analytics', 'real_time') || 'DISABLED';
    
    const value = structuredValue || flatValue || systemValue || 'DISABLED';
    return value === 'true' || value === 'ENABLED';
};
