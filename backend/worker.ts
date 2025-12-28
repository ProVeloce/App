/**
 * =====================================================
 * ProVeloce Cloudflare Worker Backend
 * =====================================================
 * 
 * IMPORTANT: CLOUDFLARE ACCESS / ZERO TRUST CONFIGURATION
 * --------------------------------------------------------
 * If you see a Cloudflare Access login page when hitting backend.proveloce.com,
 * you need to DISABLE or BYPASS Cloudflare Access for this Worker route.
 * 
 * To fix:
 * 1. Go to Cloudflare Dashboard → Zero Trust → Access → Applications
 * 2. Find any application protecting "backend.proveloce.com" or "*proveloce.com*"
 * 3. Either DELETE the application, or add a BYPASS policy for the /api/* paths
 * =====================================================
 */

// =====================================================
// CORS Configuration
// =====================================================

const ALLOWED_ORIGIN = "https://app.proveloce.com";

const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
};

function handleOptions(request: Request): Response {
    const origin = request.headers.get("Origin");
    if (origin === ALLOWED_ORIGIN) {
        return new Response(null, { status: 204, headers: corsHeaders });
    }
    return new Response(null, { status: 204 });
}

function jsonResponse(data: any, status: number = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json", ...corsHeaders },
    });
}

// =====================================================
// JWT Helper Functions (Simple implementation for Workers)
// =====================================================

async function createJWT(payload: any, secret: string, expiresInSeconds: number = 604800): Promise<string> {
    const header = { alg: "HS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const exp = now + expiresInSeconds;

    const fullPayload = { ...payload, iat: now, exp };

    const encoder = new TextEncoder();
    const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const payloadB64 = btoa(JSON.stringify(fullPayload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const signature = await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(`${headerB64}.${payloadB64}`)
    );

    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    return `${headerB64}.${payloadB64}.${signatureB64}`;
}

async function verifyJWT(token: string, secret: string): Promise<any> {
    try {
        const [headerB64, payloadB64, signatureB64] = token.split('.');

        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            "raw",
            encoder.encode(secret),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["verify"]
        );

        // Decode signature
        const signatureStr = atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/'));
        const signature = new Uint8Array([...signatureStr].map(c => c.charCodeAt(0)));

        const valid = await crypto.subtle.verify(
            "HMAC",
            key,
            signature,
            encoder.encode(`${headerB64}.${payloadB64}`)
        );

        if (!valid) return null;

        const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));

        // Check expiration
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
            return null;
        }

        return payload;
    } catch {
        return null;
    }
}

// =====================================================
// Google OAuth Helper Functions
// =====================================================

interface GoogleTokenResponse {
    access_token: string;
    id_token?: string;
    expires_in: number;
    token_type: string;
    refresh_token?: string;
}

interface GoogleUserInfo {
    id: string;
    email: string;
    verified_email: boolean;
    name: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
}

async function exchangeCodeForTokens(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string
): Promise<GoogleTokenResponse> {
    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: "authorization_code",
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Token exchange failed: ${error}`);
    }

    return response.json();
}

async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
        throw new Error("Failed to get user info from Google");
    }

    return response.json();
}

// =====================================================
// Main Worker Export
// =====================================================

export default {
    async fetch(request: Request, env: any): Promise<Response> {
        const url = new URL(request.url);

        // Handle CORS Preflight
        if (request.method === "OPTIONS") {
            return handleOptions(request);
        }

        try {
            // =====================================================
            // Base Routes
            // =====================================================

            if (url.pathname === "/api") {
                return jsonResponse({ success: true, message: "ProVeloce API Active 🚀" });
            }

            if (url.pathname === "/health") {
                return jsonResponse({ status: "ok", timestamp: new Date().toISOString() });
            }

            // =====================================================
            // Email/Password Login
            // =====================================================

            if (url.pathname === "/api/auth/login" && request.method === "POST") {
                try {
                    const body = await request.json() as { email?: string; password?: string };

                    if (!body.email || !body.password) {
                        return jsonResponse({ success: false, error: "Email and password are required" }, 400);
                    }

                    // Check if user exists in D1
                    if (!env.proveloce_db) {
                        return jsonResponse({ success: false, error: "Database not configured" }, 500);
                    }

                    const user = await env.proveloce_db.prepare(
                        "SELECT id, name, email, role, password_hash FROM users WHERE email = ?"
                    ).bind(body.email).first();

                    if (!user) {
                        return jsonResponse({ success: false, error: "Invalid email or password" }, 401);
                    }

                    // TODO: Verify password hash (implement proper password verification)
                    // For now, just generate JWT for existing user

                    const token = await createJWT(
                        { userId: user.id, email: user.email, name: user.name, role: user.role },
                        env.JWT_SECRET || "default-secret"
                    );

                    return jsonResponse({
                        success: true,
                        message: "Login successful",
                        token,
                        user: { id: user.id, name: user.name, email: user.email, role: user.role }
                    });
                } catch (e: any) {
                    return jsonResponse({ success: false, error: e.message || "Login failed" }, 400);
                }
            }

            // =====================================================
            // Google OAuth - Step 1: Redirect to Google
            // =====================================================

            if (url.pathname === "/api/auth/google") {
                const redirectUri = env.GOOGLE_CALLBACK_URL || "https://backend.proveloce.com/api/auth/google/callback";
                const clientId = env.GOOGLE_CLIENT_ID;
                const scope = "openid email profile";

                if (!clientId) {
                    return jsonResponse({ success: false, error: "GOOGLE_CLIENT_ID not configured" }, 500);
                }

                const googleURL = new URL("https://accounts.google.com/o/oauth2/v2/auth");
                googleURL.searchParams.set("client_id", clientId);
                googleURL.searchParams.set("redirect_uri", redirectUri);
                googleURL.searchParams.set("response_type", "code");
                googleURL.searchParams.set("scope", scope);
                googleURL.searchParams.set("access_type", "offline");
                googleURL.searchParams.set("prompt", "consent");

                return Response.redirect(googleURL.toString(), 302);
            }

            // =====================================================
            // Google OAuth - Step 2: Handle Callback
            // =====================================================

            if (url.pathname === "/api/auth/google/callback") {
                const code = url.searchParams.get("code");
                const error = url.searchParams.get("error");
                const frontendUrl = env.FRONTEND_URL || "https://app.proveloce.com";

                // Handle errors from Google
                if (error) {
                    return Response.redirect(
                        `${frontendUrl}/auth/error?error=${encodeURIComponent(error)}`,
                        302
                    );
                }

                if (!code) {
                    return Response.redirect(
                        `${frontendUrl}/auth/error?error=no_code_provided`,
                        302
                    );
                }

                try {
                    // Exchange code for tokens
                    const tokens = await exchangeCodeForTokens(
                        code,
                        env.GOOGLE_CLIENT_ID,
                        env.GOOGLE_CLIENT_SECRET,
                        env.GOOGLE_CALLBACK_URL || "https://backend.proveloce.com/api/auth/google/callback"
                    );

                    // Get user info from Google
                    const googleUser = await getGoogleUserInfo(tokens.access_token);

                    // Check if D1 database is available
                    if (!env.proveloce_db) {
                        console.error("D1 Database not bound");
                        return Response.redirect(
                            `${frontendUrl}/auth/error?error=database_not_configured`,
                            302
                        );
                    }

                    // Check if user exists
                    let user = await env.proveloce_db.prepare(
                        "SELECT id, name, email, role FROM users WHERE email = ?"
                    ).bind(googleUser.email).first();

                    // Create user if doesn't exist
                    if (!user) {
                        const userId = crypto.randomUUID();
                        await env.proveloce_db.prepare(
                            "INSERT INTO users (id, name, email, role, email_verified, avatar_data) VALUES (?, ?, ?, ?, ?, ?)"
                        ).bind(
                            userId,
                            googleUser.name,
                            googleUser.email,
                            "customer",
                            1,
                            googleUser.picture || null
                        ).run();

                        user = {
                            id: userId,
                            name: googleUser.name,
                            email: googleUser.email,
                            role: "customer"
                        };
                    }

                    // Generate JWT token
                    const jwtToken = await createJWT(
                        {
                            userId: user.id,
                            email: user.email,
                            name: user.name,
                            role: user.role
                        },
                        env.JWT_ACCESS_SECRET || "default-secret",
                        604800 // 7 days
                    );

                    // Redirect to frontend with token
                    const redirectUrl = new URL(`${frontendUrl}/auth/success`);
                    redirectUrl.searchParams.set("token", jwtToken);
                    redirectUrl.searchParams.set("email", user.email);
                    redirectUrl.searchParams.set("name", user.name);
                    redirectUrl.searchParams.set("role", user.role);

                    return Response.redirect(redirectUrl.toString(), 302);

                } catch (err: any) {
                    console.error("OAuth callback error:", err);
                    return Response.redirect(
                        `${frontendUrl}/auth/error?error=${encodeURIComponent(err.message || "oauth_failed")}`,
                        302
                    );
                }
            }

            // =====================================================
            // Verify Token Endpoint
            // =====================================================

            if (url.pathname === "/api/auth/verify" && request.method === "GET") {
                const authHeader = request.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return jsonResponse({ success: false, error: "No token provided" }, 401);
                }

                const token = authHeader.substring(7);
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret");

                if (!payload) {
                    return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
                }

                return jsonResponse({ success: true, user: payload });
            }

            // =====================================================
            // Get Current User (Protected)
            // =====================================================

            if (url.pathname === "/api/auth/me" && request.method === "GET") {
                const authHeader = request.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const token = authHeader.substring(7);
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret");

                if (!payload) {
                    return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
                }

                // Get fresh user data from DB
                if (env.proveloce_db) {
                    const user = await env.proveloce_db.prepare(
                        "SELECT id, name, email, role, created_at FROM users WHERE id = ?"
                    ).bind(payload.userId).first();

                    if (user) {
                        return jsonResponse({ success: true, user });
                    }
                }

                return jsonResponse({ success: true, user: payload });
            }

            // =====================================================
            // Profile Routes
            // =====================================================

            // Get current user profile
            if (url.pathname === "/api/profiles/me" && request.method === "GET") {
                const authHeader = request.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const token = authHeader.substring(7);
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret");

                if (!payload) {
                    return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
                }

                if (!env.proveloce_db) {
                    return jsonResponse({ success: false, error: "Database not configured" }, 500);
                }

                const user = await env.proveloce_db.prepare(
                    "SELECT id, name, email, role, created_at FROM users WHERE id = ?"
                ).bind(payload.userId).first();

                const profile = await env.proveloce_db.prepare(
                    "SELECT * FROM user_profiles WHERE user_id = ?"
                ).bind(payload.userId).first();

                return jsonResponse({
                    success: true,
                    data: {
                        user: { ...user, profile },
                        profileCompletion: profile ? 80 : 20
                    }
                });
            }

            // Update current user profile (PATCH)
            if (url.pathname === "/api/profiles/me" && request.method === "PATCH") {
                const authHeader = request.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const token = authHeader.substring(7);
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret");

                if (!payload) {
                    return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
                }

                if (!env.proveloce_db) {
                    return jsonResponse({ success: false, error: "Database not configured" }, 500);
                }

                const body = await request.json() as any;
                const { name, full_name, phone_number, dob, gender, addressLine1, addressLine2, city, state, country, pincode, bio } = body;

                // Update user name if provided
                if (name) {
                    await env.proveloce_db.prepare(
                        "UPDATE users SET name = ? WHERE id = ?"
                    ).bind(name, payload.userId).run();
                }

                // Upsert user profile
                const existingProfile = await env.proveloce_db.prepare(
                    "SELECT id FROM user_profiles WHERE user_id = ?"
                ).bind(payload.userId).first();

                if (existingProfile) {
                    await env.proveloce_db.prepare(`
                        UPDATE user_profiles SET 
                            full_name = COALESCE(?, full_name),
                            phone_number = COALESCE(?, phone_number),
                            dob = COALESCE(?, dob),
                            gender = COALESCE(?, gender),
                            address_line1 = COALESCE(?, address_line1),
                            address_line2 = COALESCE(?, address_line2),
                            city = COALESCE(?, city),
                            state = COALESCE(?, state),
                            country = COALESCE(?, country),
                            pincode = COALESCE(?, pincode),
                            bio = COALESCE(?, bio),
                            updated_at = CURRENT_TIMESTAMP
                        WHERE user_id = ?
                    `).bind(full_name, phone_number, dob, gender, addressLine1, addressLine2, city, state, country, pincode, bio, payload.userId).run();
                } else {
                    const profileId = crypto.randomUUID();
                    await env.proveloce_db.prepare(`
                        INSERT INTO user_profiles (id, user_id, full_name, phone_number, dob, gender, address_line1, address_line2, city, state, country, pincode, bio)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `).bind(profileId, payload.userId, full_name, phone_number, dob, gender, addressLine1, addressLine2, city, state, country, pincode, bio).run();
                }

                // Get updated user and profile
                const user = await env.proveloce_db.prepare(
                    "SELECT id, name, email, role, created_at FROM users WHERE id = ?"
                ).bind(payload.userId).first();

                const profile = await env.proveloce_db.prepare(
                    "SELECT * FROM user_profiles WHERE user_id = ?"
                ).bind(payload.userId).first();

                return jsonResponse({
                    success: true,
                    message: "Profile updated successfully",
                    data: { user: { ...user, profile } }
                });
            }

            // =====================================================
            // Change Password Route
            // =====================================================

            if (url.pathname === "/api/auth/change-password" && request.method === "POST") {
                const authHeader = request.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const token = authHeader.substring(7);
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret");

                if (!payload) {
                    return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
                }

                if (!env.proveloce_db) {
                    return jsonResponse({ success: false, error: "Database not configured" }, 500);
                }

                const body = await request.json() as any;
                const { currentPassword, newPassword, confirmPassword } = body;

                if (!currentPassword || !newPassword || !confirmPassword) {
                    return jsonResponse({ success: false, error: "All password fields are required" }, 400);
                }

                if (newPassword !== confirmPassword) {
                    return jsonResponse({ success: false, error: "New password and confirmation do not match" }, 400);
                }

                // Strong password validation
                const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
                if (!passwordRegex.test(newPassword)) {
                    return jsonResponse({
                        success: false,
                        error: "Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character (@$!%*?&)"
                    }, 400);
                }

                // Get current user
                const user = await env.proveloce_db.prepare(
                    "SELECT id, password_hash FROM users WHERE id = ?"
                ).bind(payload.userId).first() as any;

                if (!user) {
                    return jsonResponse({ success: false, error: "User not found" }, 404);
                }

                // If user has existing password, verify current password
                if (user.password_hash) {
                    // Simple hash comparison (in production, use bcrypt)
                    const encoder = new TextEncoder();
                    const data = encoder.encode(currentPassword);
                    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
                    const hashArray = Array.from(new Uint8Array(hashBuffer));
                    const currentHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

                    if (currentHash !== user.password_hash) {
                        return jsonResponse({ success: false, error: "Current password is incorrect" }, 400);
                    }
                }

                // Hash new password
                const encoder = new TextEncoder();
                const data = encoder.encode(newPassword);
                const hashBuffer = await crypto.subtle.digest("SHA-256", data);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const newHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

                // Update password
                await env.proveloce_db.prepare(
                    "UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
                ).bind(newHash, payload.userId).run();

                // Log activity
                await env.proveloce_db.prepare(
                    "INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?, ?)"
                ).bind(crypto.randomUUID(), payload.userId, "CHANGE_PASSWORD", "user", payload.userId, JSON.stringify({ timestamp: new Date().toISOString() })).run();

                return jsonResponse({ success: true, message: "Password changed successfully" });
            }

            // =====================================================
            // Login History Route
            // =====================================================

            if (url.pathname === "/api/auth/login-history" && request.method === "GET") {
                const authHeader = request.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const token = authHeader.substring(7);
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret");

                if (!payload) {
                    return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
                }

                if (!env.proveloce_db) {
                    return jsonResponse({ success: false, error: "Database not configured" }, 500);
                }

                // Get login history from activity_logs
                const history = await env.proveloce_db.prepare(
                    `SELECT id, action, ip_address, user_agent, metadata, created_at 
                     FROM activity_logs 
                     WHERE user_id = ? AND action IN ('LOGIN', 'LOGIN_OAUTH', 'LOGIN_FAILED')
                     ORDER BY created_at DESC 
                     LIMIT 20`
                ).bind(payload.userId).all();

                const loginHistory = history.results.map((entry: any) => ({
                    id: entry.id,
                    createdAt: entry.created_at,
                    ipAddress: entry.ip_address || 'Unknown',
                    device: entry.user_agent ? (entry.user_agent.substring(0, 50) + '...') : 'Unknown device',
                    success: entry.action !== 'LOGIN_FAILED'
                }));

                return jsonResponse({ success: true, data: { loginHistory } });
            }

            // =====================================================
            // D1 Database Routes
            // =====================================================

            if (url.pathname === "/api/db/test") {
                if (!env.proveloce_db) {
                    return jsonResponse({ success: false, error: "D1 Database not bound" }, 500);
                }
                const result = await env.proveloce_db.prepare("SELECT 1 as test").all();
                return jsonResponse({ success: true, message: "D1 Database Connected ✔", result: result.results });
            }

            if (url.pathname === "/api/db/users" && request.method === "GET") {
                if (!env.proveloce_db) {
                    return jsonResponse({ success: false, error: "D1 Database not bound" }, 500);
                }
                const result = await env.proveloce_db.prepare(
                    "SELECT id, name, email, role, created_at FROM users LIMIT 50"
                ).all();
                return jsonResponse({ success: true, users: result.results });
            }

            if (url.pathname === "/api/db/users" && request.method === "POST") {
                if (!env.proveloce_db) {
                    return jsonResponse({ success: false, error: "D1 Database not bound" }, 500);
                }
                const body = await request.json() as any;
                const id = crypto.randomUUID();
                await env.proveloce_db.prepare(
                    "INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, ?)"
                ).bind(id, body.name, body.email, body.role || "customer").run();
                return jsonResponse({ success: true, message: "User created", id }, 201);
            }

            if (url.pathname.startsWith("/api/db/users/") && request.method === "GET") {
                if (!env.proveloce_db) {
                    return jsonResponse({ success: false, error: "D1 Database not bound" }, 500);
                }
                const id = url.pathname.split("/").pop();
                const result = await env.proveloce_db.prepare(
                    "SELECT id, name, email, role, created_at FROM users WHERE id = ?"
                ).bind(id).first();
                if (!result) {
                    return jsonResponse({ success: false, error: "User not found" }, 404);
                }
                return jsonResponse({ success: true, user: result });
            }

            // =====================================================
            // Admin Routes (Protected - ADMIN/SUPERADMIN only)
            // =====================================================

            // Helper: Check if user has admin role
            const checkAdminRole = async (req: Request): Promise<{ valid: boolean; payload?: any; error?: string }> => {
                const authHeader = req.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return { valid: false, error: "Unauthorized" };
                }
                const token = authHeader.substring(7);
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret");
                if (!payload) {
                    return { valid: false, error: "Invalid or expired token" };
                }
                const role = (payload.role || "").toLowerCase();
                if (role !== "admin" && role !== "superadmin") {
                    return { valid: false, error: "Insufficient permissions" };
                }
                return { valid: true, payload };
            };

            // GET /api/admin/users - List all users with filtering
            if (url.pathname === "/api/admin/users" && request.method === "GET") {
                const auth = await checkAdminRole(request);
                if (!auth.valid) {
                    return jsonResponse({ success: false, error: auth.error }, 401);
                }

                if (!env.proveloce_db) {
                    return jsonResponse({ success: false, error: "Database not configured" }, 500);
                }

                const filterRole = url.searchParams.get("role");
                const status = url.searchParams.get("status");
                const search = url.searchParams.get("search");
                const page = parseInt(url.searchParams.get("page") || "1");
                const limit = parseInt(url.searchParams.get("limit") || "20");
                const offset = (page - 1) * limit;

                let query = "SELECT id, name, email, phone, role, status, email_verified, last_login_at, created_at FROM users WHERE 1=1";
                const params: any[] = [];

                // Role-based visibility restrictions
                const requesterRole = (auth.payload.role || "").toLowerCase();
                if (requesterRole === "superadmin") {
                    // SuperAdmin cannot see other SuperAdmins (including themselves)
                    query += " AND role != 'superadmin'";
                } else if (requesterRole === "admin") {
                    // Admin can only see Customer, Expert, Analyst
                    query += " AND role IN ('customer', 'expert', 'analyst')";
                }

                if (filterRole) {
                    query += " AND role = ?";
                    params.push(filterRole);
                }
                if (status) {
                    query += " AND status = ?";
                    params.push(status);
                }
                if (search) {
                    query += " AND (name LIKE ? OR email LIKE ?)";
                    params.push(`%${search}%`, `%${search}%`);
                }

                // Get total count
                const countQuery = query.replace("SELECT id, name, email, phone, role, status, email_verified, last_login_at, created_at", "SELECT COUNT(*) as total");
                const countResult = await env.proveloce_db.prepare(countQuery).bind(...params).first() as any;
                const total = countResult?.total || 0;

                // Get paginated results
                query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
                params.push(limit, offset);

                const result = await env.proveloce_db.prepare(query).bind(...params).all();

                return jsonResponse({
                    success: true,
                    data: {
                        users: result.results,
                        pagination: {
                            page,
                            limit,
                            total,
                            totalPages: Math.ceil(total / limit)
                        }
                    }
                });
            }

            // GET /api/admin/users/:id - Get single user
            if (url.pathname.match(/^\/api\/admin\/users\/[^\/]+$/) && request.method === "GET") {
                const auth = await checkAdminRole(request);
                if (!auth.valid) {
                    return jsonResponse({ success: false, error: auth.error }, 401);
                }

                if (!env.proveloce_db) {
                    return jsonResponse({ success: false, error: "Database not configured" }, 500);
                }

                const id = url.pathname.split("/").pop();
                const user = await env.proveloce_db.prepare(
                    "SELECT id, name, email, phone, role, status, email_verified, last_login_at, created_at FROM users WHERE id = ?"
                ).bind(id).first();

                if (!user) {
                    return jsonResponse({ success: false, error: "User not found" }, 404);
                }

                const profile = await env.proveloce_db.prepare(
                    "SELECT * FROM user_profiles WHERE user_id = ?"
                ).bind(id).first();

                return jsonResponse({ success: true, data: { user: { ...user, profile } } });
            }

            // POST /api/admin/users - Create new user
            if (url.pathname === "/api/admin/users" && request.method === "POST") {
                const auth = await checkAdminRole(request);
                if (!auth.valid) {
                    return jsonResponse({ success: false, error: auth.error }, 401);
                }

                if (!env.proveloce_db) {
                    return jsonResponse({ success: false, error: "Database not configured" }, 500);
                }

                const body = await request.json() as any;
                const { name, email, phone, role, status } = body;

                if (!name || !email) {
                    return jsonResponse({ success: false, error: "Name and email are required" }, 400);
                }

                // Check if email exists
                const existing = await env.proveloce_db.prepare(
                    "SELECT id FROM users WHERE email = ?"
                ).bind(email).first();

                if (existing) {
                    return jsonResponse({ success: false, error: "Email already exists" }, 409);
                }

                // Role creation restrictions
                const requesterRole = (auth.payload.role || "").toLowerCase();
                const newRole = (role || "customer").toLowerCase();

                // Admin cannot create admin or superadmin users
                if (requesterRole === "admin" && (newRole === "admin" || newRole === "superadmin")) {
                    return jsonResponse({ success: false, error: "You don't have permission to create users with this role" }, 403);
                }

                // Only superadmin can create superadmin users
                if (newRole === "superadmin" && requesterRole !== "superadmin") {
                    return jsonResponse({ success: false, error: "Only superadmin can create superadmin users" }, 403);
                }

                const id = crypto.randomUUID();
                await env.proveloce_db.prepare(
                    "INSERT INTO users (id, name, email, phone, role, status, email_verified) VALUES (?, ?, ?, ?, ?, ?, 1)"
                ).bind(id, name, email, phone || null, newRole, status || "active").run();

                // Log activity
                await env.proveloce_db.prepare(
                    "INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?, ?)"
                ).bind(crypto.randomUUID(), auth.payload.userId, "CREATE_USER", "user", id, JSON.stringify({ name, email, role })).run();

                const newUser = await env.proveloce_db.prepare(
                    "SELECT id, name, email, phone, role, status, created_at FROM users WHERE id = ?"
                ).bind(id).first();

                return jsonResponse({ success: true, message: "User created successfully", data: { user: newUser } }, 201);
            }

            // PATCH /api/admin/users/:id - Update user
            if (url.pathname.match(/^\/api\/admin\/users\/[^\/]+$/) && request.method === "PATCH") {
                const auth = await checkAdminRole(request);
                if (!auth.valid) {
                    return jsonResponse({ success: false, error: auth.error }, 401);
                }

                if (!env.proveloce_db) {
                    return jsonResponse({ success: false, error: "Database not configured" }, 500);
                }

                const id = url.pathname.split("/").pop();
                const body = await request.json() as any;
                const { name, email, phone, role, status } = body;

                // Check if user exists and get their current role
                const existing = await env.proveloce_db.prepare(
                    "SELECT id, role FROM users WHERE id = ?"
                ).bind(id).first() as any;

                if (!existing) {
                    return jsonResponse({ success: false, error: "User not found" }, 404);
                }

                // Get requester's role
                const requesterRole = (auth.payload.role || "").toLowerCase();
                const targetRole = (existing.role || "").toLowerCase();

                // Prevent modifying superadmin accounts
                if (targetRole === "superadmin") {
                    return jsonResponse({ success: false, error: "Cannot modify superadmin accounts" }, 403);
                }

                // Admin cannot modify other admins
                if (requesterRole === "admin" && targetRole === "admin") {
                    return jsonResponse({ success: false, error: "Admins cannot modify other admins" }, 403);
                }

                // Privilege escalation prevention
                if (role !== undefined) {
                    const newRole = role.toLowerCase();
                    // Admin cannot assign admin or superadmin roles
                    if (requesterRole === "admin" && (newRole === "admin" || newRole === "superadmin")) {
                        return jsonResponse({ success: false, error: "You don't have permission to assign this role" }, 403);
                    }
                    // Only superadmin can assign superadmin role
                    if (newRole === "superadmin" && requesterRole !== "superadmin") {
                        return jsonResponse({ success: false, error: "Only superadmin can assign superadmin role" }, 403);
                    }
                }

                // Build update query dynamically
                const updates: string[] = [];
                const values: any[] = [];

                if (name !== undefined) { updates.push("name = ?"); values.push(name); }
                if (email !== undefined) { updates.push("email = ?"); values.push(email); }
                if (phone !== undefined) { updates.push("phone = ?"); values.push(phone); }
                if (role !== undefined) { updates.push("role = ?"); values.push(role); }
                if (status !== undefined) { updates.push("status = ?"); values.push(status); }

                if (updates.length === 0) {
                    return jsonResponse({ success: false, error: "No fields to update" }, 400);
                }

                updates.push("updated_at = CURRENT_TIMESTAMP");
                values.push(id);

                await env.proveloce_db.prepare(
                    `UPDATE users SET ${updates.join(", ")} WHERE id = ?`
                ).bind(...values).run();

                // Log activity
                await env.proveloce_db.prepare(
                    "INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?, ?)"
                ).bind(crypto.randomUUID(), auth.payload.userId, "UPDATE_USER", "user", id, JSON.stringify(body)).run();

                const updatedUser = await env.proveloce_db.prepare(
                    "SELECT id, name, email, phone, role, status, created_at FROM users WHERE id = ?"
                ).bind(id).first();

                return jsonResponse({ success: true, message: "User updated successfully", data: { user: updatedUser } });
            }

            // DELETE /api/admin/users/:id - Deactivate user
            if (url.pathname.match(/^\/api\/admin\/users\/[^\/]+$/) && request.method === "DELETE") {
                const auth = await checkAdminRole(request);
                if (!auth.valid) {
                    return jsonResponse({ success: false, error: auth.error }, 401);
                }

                if (!env.proveloce_db) {
                    return jsonResponse({ success: false, error: "Database not configured" }, 500);
                }

                const id = url.pathname.split("/").pop();

                // Check if user exists
                const existing = await env.proveloce_db.prepare(
                    "SELECT id, role FROM users WHERE id = ?"
                ).bind(id).first() as any;

                if (!existing) {
                    return jsonResponse({ success: false, error: "User not found" }, 404);
                }

                // Prevent deleting superadmin
                if (existing.role === "superadmin") {
                    return jsonResponse({ success: false, error: "Cannot delete superadmin" }, 403);
                }

                // Soft delete - set status to deactivated
                await env.proveloce_db.prepare(
                    "UPDATE users SET status = 'deactivated', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
                ).bind(id).run();

                // Log activity
                await env.proveloce_db.prepare(
                    "INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?, ?)"
                ).bind(crypto.randomUUID(), auth.payload.userId, "DELETE_USER", "user", id, JSON.stringify({ userId: id })).run();

                return jsonResponse({ success: true, message: "User deactivated successfully" });
            }

            // GET /api/admin/stats - Dashboard statistics
            if (url.pathname === "/api/admin/stats" && request.method === "GET") {
                const auth = await checkAdminRole(request);
                if (!auth.valid) {
                    return jsonResponse({ success: false, error: auth.error }, 401);
                }

                if (!env.proveloce_db) {
                    return jsonResponse({ success: false, error: "Database not configured" }, 500);
                }

                const stats = {
                    totalUsers: 0,
                    admins: 0,
                    analysts: 0,
                    experts: 0,
                    customers: 0,
                    activeUsers: 0,
                    pendingUsers: 0,
                    recentUsers: [] as any[]
                };

                // Get counts by role
                const roleCounts = await env.proveloce_db.prepare(
                    "SELECT role, COUNT(*) as count FROM users GROUP BY role"
                ).all();

                for (const row of roleCounts.results as any[]) {
                    const role = (row.role || "").toLowerCase();
                    const count = row.count || 0;
                    stats.totalUsers += count;
                    if (role === "admin") stats.admins = count;
                    if (role === "analyst") stats.analysts = count;
                    if (role === "expert") stats.experts = count;
                    if (role === "customer") stats.customers = count;
                }

                // Get counts by status
                const statusCounts = await env.proveloce_db.prepare(
                    "SELECT status, COUNT(*) as count FROM users GROUP BY status"
                ).all();

                for (const row of statusCounts.results as any[]) {
                    const status = (row.status || "").toLowerCase();
                    const count = row.count || 0;
                    if (status === "active") stats.activeUsers = count;
                    if (status === "pending_verification") stats.pendingUsers = count;
                }

                // Get recent users
                const recentUsers = await env.proveloce_db.prepare(
                    "SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC LIMIT 5"
                ).all();
                stats.recentUsers = recentUsers.results as any[];

                return jsonResponse({ success: true, data: stats });
            }

            // GET /api/admin/logs - Activity logs (SUPERADMIN only)
            if (url.pathname === "/api/admin/logs" && request.method === "GET") {
                const auth = await checkAdminRole(request);
                if (!auth.valid) {
                    return jsonResponse({ success: false, error: auth.error }, 401);
                }

                // Restrict to superadmin only
                if ((auth.payload.role || "").toLowerCase() !== "superadmin") {
                    return jsonResponse({ success: false, error: "Superadmin access required" }, 403);
                }

                if (!env.proveloce_db) {
                    return jsonResponse({ success: false, error: "Database not configured" }, 500);
                }

                const action = url.searchParams.get("action");
                const userId = url.searchParams.get("userId");
                const page = parseInt(url.searchParams.get("page") || "1");
                const limit = parseInt(url.searchParams.get("limit") || "50");
                const offset = (page - 1) * limit;

                let query = `
                    SELECT al.*, u.name as user_name, u.email as user_email 
                    FROM activity_logs al 
                    LEFT JOIN users u ON al.user_id = u.id 
                    WHERE 1=1
                `;
                const params: any[] = [];

                if (action) {
                    query += " AND al.action = ?";
                    params.push(action);
                }
                if (userId) {
                    query += " AND al.user_id = ?";
                    params.push(userId);
                }

                query += " ORDER BY al.created_at DESC LIMIT ? OFFSET ?";
                params.push(limit, offset);

                const result = await env.proveloce_db.prepare(query).bind(...params).all();

                return jsonResponse({ success: true, data: { logs: result.results } });
            }

            // =====================================================
            // Default Route
            // =====================================================

            return new Response("ProVeloce Cloudflare Backend Running ✔", {
                headers: { "Content-Type": "text/plain", ...corsHeaders }
            });

        } catch (error: any) {
            console.error("Worker error:", error);
            return jsonResponse({ success: false, error: error.message || "Internal Server Error" }, 500);
        }
    }
}
