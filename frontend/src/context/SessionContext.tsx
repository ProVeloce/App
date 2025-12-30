import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { encodeSessionUrl, decodeSessionUrl, isValidSessionToken } from '../utils/sessionUrl';

interface SessionContextType {
    sessionId: string | null;
    encodedToken: string | null;
    lastActivityTime: number;
    remainingTime: number; // in seconds
    isSessionExpired: boolean;
    showTimeoutWarning: boolean;
    resetActivityTimer: () => void;
    startSession: () => string;
    endSession: () => void;
    dismissWarning: () => void;
    encodeCurrentUrl: (route: string) => string;
    decodeUrl: (token: string) => { sessionId: string | null; route: string | null };
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

// Session timeout: 30 minutes (in milliseconds)
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
// Warning shown 2 minutes before timeout
const WARNING_THRESHOLD_MS = 2 * 60 * 1000;
// Check interval: every 10 seconds
const CHECK_INTERVAL_MS = 10 * 1000;

// Generate a UUID for session ID
function generateSessionId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [sessionId, setSessionId] = useState<string | null>(() => {
        // Restore session ID from sessionStorage if exists
        return sessionStorage.getItem('sessionId');
    });
    const [encodedToken, setEncodedToken] = useState<string | null>(() => {
        return sessionStorage.getItem('encodedToken');
    });
    const [lastActivityTime, setLastActivityTime] = useState<number>(() => {
        const stored = sessionStorage.getItem('lastActivityTime');
        return stored ? parseInt(stored, 10) : Date.now();
    });
    const [remainingTime, setRemainingTime] = useState<number>(SESSION_TIMEOUT_MS / 1000);
    const [isSessionExpired, setIsSessionExpired] = useState<boolean>(false);
    const [showTimeoutWarning, setShowTimeoutWarning] = useState<boolean>(false);

    const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Start a new session
    const startSession = useCallback((): string => {
        const newSessionId = generateSessionId();
        const now = Date.now();
        const initialToken = encodeSessionUrl(newSessionId, '/dashboard');

        setSessionId(newSessionId);
        setEncodedToken(initialToken);
        setLastActivityTime(now);
        setIsSessionExpired(false);
        setShowTimeoutWarning(false);
        setRemainingTime(SESSION_TIMEOUT_MS / 1000);

        sessionStorage.setItem('sessionId', newSessionId);
        sessionStorage.setItem('encodedToken', initialToken);
        sessionStorage.setItem('lastActivityTime', now.toString());

        return newSessionId;
    }, []);

    // End the current session
    const endSession = useCallback(() => {
        setSessionId(null);
        setEncodedToken(null);
        setLastActivityTime(0);
        setIsSessionExpired(false);
        setShowTimeoutWarning(false);
        setRemainingTime(0);

        sessionStorage.removeItem('sessionId');
        sessionStorage.removeItem('encodedToken');
        sessionStorage.removeItem('lastActivityTime');
    }, []);

    // Reset activity timer (called on user activity)
    const resetActivityTimer = useCallback(() => {
        if (!sessionId) return;

        const now = Date.now();
        setLastActivityTime(now);
        setShowTimeoutWarning(false);
        setRemainingTime(SESSION_TIMEOUT_MS / 1000);

        sessionStorage.setItem('lastActivityTime', now.toString());
    }, [sessionId]);

    // Dismiss warning and reset timer
    const dismissWarning = useCallback(() => {
        resetActivityTimer();
    }, [resetActivityTimer]);

    // Encode current URL with session
    const encodeCurrentUrl = useCallback((route: string): string => {
        if (!sessionId) return route;
        const token = encodeSessionUrl(sessionId, route);
        setEncodedToken(token);
        sessionStorage.setItem('encodedToken', token);
        return token;
    }, [sessionId]);

    // Decode URL token
    const decodeUrl = useCallback((token: string) => {
        return decodeSessionUrl(token);
    }, []);

    // Check session status periodically
    useEffect(() => {
        if (!sessionId) {
            if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current);
                checkIntervalRef.current = null;
            }
            return;
        }

        const checkSession = () => {
            const now = Date.now();
            const elapsed = now - lastActivityTime;
            const remaining = SESSION_TIMEOUT_MS - elapsed;

            if (remaining <= 0) {
                // Session expired
                setIsSessionExpired(true);
                setShowTimeoutWarning(false);
                setRemainingTime(0);
            } else if (remaining <= WARNING_THRESHOLD_MS) {
                // Show warning
                setShowTimeoutWarning(true);
                setRemainingTime(Math.floor(remaining / 1000));
            } else {
                setShowTimeoutWarning(false);
                setRemainingTime(Math.floor(remaining / 1000));
            }
        };

        // Initial check
        checkSession();

        // Set up interval
        checkIntervalRef.current = setInterval(checkSession, CHECK_INTERVAL_MS);

        return () => {
            if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current);
                checkIntervalRef.current = null;
            }
        };
    }, [sessionId, lastActivityTime]);

    // Track user activity
    useEffect(() => {
        if (!sessionId) return;

        const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];

        // Throttle activity updates to avoid excessive state updates
        let lastUpdateTime = Date.now();
        const throttleMs = 5000; // Only update every 5 seconds max

        const handleActivity = () => {
            const now = Date.now();
            if (now - lastUpdateTime >= throttleMs) {
                lastUpdateTime = now;
                resetActivityTimer();
            }
        };

        activityEvents.forEach(event => {
            window.addEventListener(event, handleActivity, { passive: true });
        });

        return () => {
            activityEvents.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [sessionId, resetActivityTimer]);

    return (
        <SessionContext.Provider
            value={{
                sessionId,
                encodedToken,
                lastActivityTime,
                remainingTime,
                isSessionExpired,
                showTimeoutWarning,
                resetActivityTimer,
                startSession,
                endSession,
                dismissWarning,
                encodeCurrentUrl,
                decodeUrl,
            }}
        >
            {children}
        </SessionContext.Provider>
    );
};

export const useSession = (): SessionContextType => {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error('useSession must be used within a SessionProvider');
    }
    return context;
};
