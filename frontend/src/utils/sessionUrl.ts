/**
 * Session URL Encoding/Decoding Utilities
 * 
 * Generates 512-bit (64 bytes = 128 hex chars) encoded session tokens
 * that include session ID and route information.
 */

// Route mapping for encoding/decoding
const ROUTE_MAP: Record<string, string> = {
    '/dashboard': '01',
    '/profile': '02',
    '/notifications': '03',
    '/help-desk': '04',
    '/change-password': '05',
    '/customer/apply-expert': '10',
    '/customer/application-status': '11',
    '/expert/dashboard': '20',
    '/expert/portfolio': '21',
    '/expert/certifications': '22',
    '/expert/tasks': '23',
    '/expert/earnings': '24',
    '/analyst/dashboard': '30',
    '/analyst/verification': '31',
    '/admin/dashboard': '40',
    '/admin/users': '41',
    '/admin/expert-review': '42',
    '/admin/task-assignment': '43',
    '/admin/reports': '44',
    '/superadmin/dashboard': '50',
    '/superadmin/admins': '51',
    '/superadmin/config': '52',
    '/superadmin/logs': '53',
};

// Reverse mapping
const ROUTE_REVERSE_MAP: Record<string, string> = Object.fromEntries(
    Object.entries(ROUTE_MAP).map(([k, v]) => [v, k])
);

/**
 * Generate a 512-bit secure random string (128 hex characters)
 */
function generateSecureRandom(): string {
    const array = new Uint8Array(64); // 64 bytes = 512 bits
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * XOR encode/decode a string with a key
 */
function xorEncode(data: string, key: string): string {
    let result = '';
    for (let i = 0; i < data.length; i++) {
        const charCode = data.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        result += charCode.toString(16).padStart(2, '0');
    }
    return result;
}

function xorDecode(encodedHex: string, key: string): string {
    let result = '';
    for (let i = 0; i < encodedHex.length; i += 2) {
        const charCode = parseInt(encodedHex.substr(i, 2), 16) ^ key.charCodeAt((i / 2) % key.length);
        result += String.fromCharCode(charCode);
    }
    return result;
}

/**
 * Encode session ID and route into a 512-bit URL-safe token
 * 
 * Structure (128 hex chars = 512 bits):
 * - Bytes 0-31 (64 chars): Random noise prefix
 * - Bytes 32-47 (32 chars): Encoded session ID (36 chars UUID -> XOR encoded)
 * - Bytes 48-49 (4 chars): Route code (2 chars -> padded)
 * - Bytes 50-55 (12 chars): Timestamp (6 bytes)
 * - Bytes 56-63 (16 chars): Checksum/Random suffix
 */
export function encodeSessionUrl(sessionId: string, route: string): string {
    // Generate random prefix (32 bytes = 64 hex chars)
    const prefix = generateSecureRandom().substring(0, 64);

    // Encode session ID (remove dashes, XOR encode)
    const sessionClean = sessionId.replace(/-/g, '');
    const sessionKey = prefix.substring(0, 32);
    const encodedSession = xorEncode(sessionClean, sessionKey);

    // Get route code (2 chars, padded to 4)
    const routeCode = ROUTE_MAP[route] || '00';
    const paddedRoute = routeCode.padStart(4, '0');

    // Timestamp (6 bytes = 12 hex chars)
    const timestamp = Date.now().toString(16).padStart(12, '0').substring(0, 12);

    // Random suffix for padding (8 bytes = 16 hex chars)
    const suffix = generateSecureRandom().substring(0, 16);

    // Combine: prefix(64) + session(64) + route(4) + timestamp(12) + suffix(16) = 160 chars
    // Truncate to 128 chars for clean 512-bit
    const fullToken = prefix + encodedSession.substring(0, 32) + paddedRoute + timestamp + suffix;
    return fullToken.substring(0, 128);
}

/**
 * Decode a 512-bit token back to session ID and route
 */
export function decodeSessionUrl(token: string): { sessionId: string | null; route: string | null } {
    if (!token || token.length !== 128) {
        return { sessionId: null, route: null };
    }

    try {
        // Extract parts
        const prefix = token.substring(0, 64);
        const encodedSession = token.substring(64, 96);
        const routeCode = token.substring(96, 100).replace(/^0+/, '') || '00';

        // Decode session ID
        const sessionKey = prefix.substring(0, 32);
        const sessionClean = xorDecode(encodedSession, sessionKey);

        // Reconstruct UUID format
        const sessionId = [
            sessionClean.substring(0, 8),
            sessionClean.substring(8, 12),
            sessionClean.substring(12, 16),
            sessionClean.substring(16, 20),
            sessionClean.substring(20, 32),
        ].join('-');

        // Get route
        const route = ROUTE_REVERSE_MAP[routeCode] || '/dashboard';

        return { sessionId, route };
    } catch (error) {
        console.error('Failed to decode session URL:', error);
        return { sessionId: null, route: null };
    }
}

/**
 * Validate if a string looks like a valid session token
 */
export function isValidSessionToken(token: string): boolean {
    return /^[a-f0-9]{128}$/i.test(token);
}

/**
 * Get the route code for a given route path
 */
export function getRouteCode(route: string): string {
    return ROUTE_MAP[route] || '00';
}

/**
 * Check if a route path is mapped
 */
export function isRouteMapped(route: string): boolean {
    return route in ROUTE_MAP;
}
