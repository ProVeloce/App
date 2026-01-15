/**
 * Date/Time Utility Functions
 * All times are stored and displayed in IST (India Standard Time, GMT+05:30)
 * All times use 24-hour format (HH:mm)
 */

// IST timezone identifier
export const IST_TIMEZONE = 'Asia/Kolkata';

// Locale for formatting
export const IST_LOCALE = 'en-IN';

/**
 * Convert a date to IST and return as ISO string
 * Use this when saving timestamps to the database
 */
export function toISTString(date?: Date | string | null): string {
    if (!date) {
        date = new Date();
    }
    
    if (typeof date === 'string') {
        date = new Date(date);
    }
    
    // Format to IST timezone
    const istDate = new Date(date.toLocaleString('en-US', { timeZone: IST_TIMEZONE }));
    return istDate.toISOString();
}

/**
 * Get current timestamp in IST as ISO string
 * Use this for created_at, updated_at fields
 */
export function nowIST(): string {
    return new Date().toLocaleString('en-US', { timeZone: IST_TIMEZONE });
}

/**
 * Format date for display in 24-hour format
 * Returns: "15 Jan 2026, 14:30"
 */
export function formatDateTime(date: Date | string | null | undefined): string {
    if (!date) return '-';
    
    try {
        const d = typeof date === 'string' ? new Date(date) : date;
        
        if (isNaN(d.getTime())) return '-';
        
        return d.toLocaleString(IST_LOCALE, {
            timeZone: IST_TIMEZONE,
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    } catch {
        return '-';
    }
}

/**
 * Format date only (no time)
 * Returns: "15 Jan 2026"
 */
export function formatDate(date: Date | string | null | undefined): string {
    if (!date) return '-';
    
    try {
        const d = typeof date === 'string' ? new Date(date) : date;
        
        if (isNaN(d.getTime())) return '-';
        
        return d.toLocaleDateString(IST_LOCALE, {
            timeZone: IST_TIMEZONE,
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    } catch {
        return '-';
    }
}

/**
 * Format time only in 24-hour format
 * Returns: "14:30"
 */
export function formatTime(date: Date | string | null | undefined): string {
    if (!date) return '-';
    
    try {
        const d = typeof date === 'string' ? new Date(date) : date;
        
        if (isNaN(d.getTime())) return '-';
        
        return d.toLocaleTimeString(IST_LOCALE, {
            timeZone: IST_TIMEZONE,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    } catch {
        return '-';
    }
}

/**
 * Format relative time (e.g., "2 hours ago", "Yesterday")
 */
export function formatRelativeTime(date: Date | string | null | undefined): string {
    if (!date) return '-';
    
    try {
        const d = typeof date === 'string' ? new Date(date) : date;
        
        if (isNaN(d.getTime())) return '-';
        
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        
        return formatDate(d);
    } catch {
        return '-';
    }
}

/**
 * Format for input[type="datetime-local"]
 * Returns: "2026-01-15T14:30"
 */
export function formatForInput(date: Date | string | null | undefined): string {
    if (!date) return '';
    
    try {
        const d = typeof date === 'string' ? new Date(date) : date;
        
        if (isNaN(d.getTime())) return '';
        
        // Get IST components
        const options: Intl.DateTimeFormatOptions = {
            timeZone: IST_TIMEZONE,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        };
        
        const parts = new Intl.DateTimeFormat('en-CA', options).formatToParts(d);
        const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';
        
        return `${getPart('year')}-${getPart('month')}-${getPart('day')}T${getPart('hour')}:${getPart('minute')}`;
    } catch {
        return '';
    }
}

/**
 * Format for input[type="date"]
 * Returns: "2026-01-15"
 */
export function formatDateForInput(date: Date | string | null | undefined): string {
    if (!date) return '';
    
    try {
        const d = typeof date === 'string' ? new Date(date) : date;
        
        if (isNaN(d.getTime())) return '';
        
        const options: Intl.DateTimeFormatOptions = {
            timeZone: IST_TIMEZONE,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        };
        
        const parts = new Intl.DateTimeFormat('en-CA', options).formatToParts(d);
        const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';
        
        return `${getPart('year')}-${getPart('month')}-${getPart('day')}`;
    } catch {
        return '';
    }
}

/**
 * Parse input value to Date object in IST
 */
export function parseInputToIST(inputValue: string): Date | null {
    if (!inputValue) return null;
    
    try {
        // Input format: "2026-01-15" or "2026-01-15T14:30"
        const d = new Date(inputValue);
        if (isNaN(d.getTime())) return null;
        return d;
    } catch {
        return null;
    }
}

/**
 * Format full datetime with weekday
 * Returns: "Wednesday, 15 Jan 2026, 14:30"
 */
export function formatFullDateTime(date: Date | string | null | undefined): string {
    if (!date) return '-';
    
    try {
        const d = typeof date === 'string' ? new Date(date) : date;
        
        if (isNaN(d.getTime())) return '-';
        
        return d.toLocaleString(IST_LOCALE, {
            timeZone: IST_TIMEZONE,
            weekday: 'long',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    } catch {
        return '-';
    }
}

/**
 * Check if a date is today
 */
export function isToday(date: Date | string | null | undefined): boolean {
    if (!date) return false;
    
    try {
        const d = typeof date === 'string' ? new Date(date) : date;
        const today = new Date();
        
        // Compare in IST
        const dIST = d.toLocaleDateString(IST_LOCALE, { timeZone: IST_TIMEZONE });
        const todayIST = today.toLocaleDateString(IST_LOCALE, { timeZone: IST_TIMEZONE });
        
        return dIST === todayIST;
    } catch {
        return false;
    }
}

/**
 * Get IST offset string for SQL datetime functions
 * SQLite doesn't support timezones natively, so we compute the offset
 */
export function getISTOffset(): string {
    return '+05:30';
}
