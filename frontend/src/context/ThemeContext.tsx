import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useConfig } from './ConfigContext';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Helper to get theme based on config and user preference
const getInitialTheme = (configDefault?: string): Theme => {
    // First check user's saved preference
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') {
        return saved;
    }
    
    // Check system config default
    if (configDefault === 'dark') return 'dark';
    if (configDefault === 'light') return 'light';
    
    // If 'system' or not set, use system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { config, configVersion } = useConfig();
    const [theme, setThemeState] = useState<Theme>(() => getInitialTheme());
    const [hasUserOverride, setHasUserOverride] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved === 'dark' || saved === 'light';
    });

    // Apply theme to document
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        if (hasUserOverride) {
            localStorage.setItem('theme', theme);
        }
    }, [theme, hasUserOverride]);

    // Listen for config changes to update default theme (only if user hasn't overridden)
    useEffect(() => {
        if (!hasUserOverride && config.ui.defaultTheme) {
            const newTheme = getInitialTheme(config.ui.defaultTheme);
            setThemeState(newTheme);
        }
    }, [config.ui.defaultTheme, configVersion, hasUserOverride]);

    const toggleTheme = () => {
        setHasUserOverride(true);
        setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    const setTheme = (newTheme: Theme) => {
        setHasUserOverride(true);
        setThemeState(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
