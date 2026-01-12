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
            // GET /api/auth/me - Current User with Application Status
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

                if (!env.proveloce_db) {
                    return jsonResponse({ success: false, error: "Database not configured" }, 500);
                }

                try {
                    // Fetch user from database
                    const user = await env.proveloce_db.prepare(
                        "SELECT id, name, email, phone, role, status, email_verified, created_at FROM users WHERE id = ?"
                    ).bind(payload.userId).first() as any;

                    if (!user) {
                        return jsonResponse({ success: false, error: "User not found" }, 404);
                    }

                    // Fetch expert application status
                    const application = await env.proveloce_db.prepare(
                        "SELECT id, status, submitted_at, rejection_reason FROM expert_applications WHERE user_id = ?"
                    ).bind(payload.userId).first() as any;

                    // Determine application status (NONE if no application exists)
                    const applicationStatus = application
                        ? (application.status || 'DRAFT').toUpperCase()
                        : 'NONE';

                    return jsonResponse({
                        success: true,
                        data: {
                            user: {
                                id: user.id,
                                name: user.name,
                                email: user.email,
                                phone: user.phone,
                                role: (user.role || 'customer').toUpperCase(),
                                status: user.status || 'ACTIVE',
                                emailVerified: !!user.email_verified,
                                createdAt: user.created_at,
                            },
                            // Application state for UI control
                            expertApplication: {
                                status: applicationStatus,
                                applicationId: application?.id || null,
                                submittedAt: application?.submitted_at || null,
                                rejectionReason: application?.rejection_reason || null,
                            }
                        }
                    });
                } catch (error: any) {
                    console.error("Error fetching user:", error);
                    return jsonResponse({ success: false, error: "Failed to fetch user" }, 500);
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
                        "SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?"
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
                    "SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?"
                ).bind(payload.userId).first() as any;

                const profile = await env.proveloce_db.prepare(
                    "SELECT * FROM user_profiles WHERE user_id = ?"
                ).bind(payload.userId).first() as any;

                // Return user data with phone explicitly at top level
                return jsonResponse({
                    success: true,
                    data: {
                        user: {
                            id: user?.id,
                            name: user?.name,
                            email: user?.email,
                            phone: user?.phone || null,
                            role: user?.role,
                            created_at: user?.created_at,
                            profile: profile || null
                        },
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
                const { name, phone, dob, gender, addressLine1, addressLine2, city, state, country, pincode, bio } = body;

                // Update user name and phone if provided (these are in users table)
                if (name || phone) {
                    const updates = [];
                    const values = [];

                    if (name) {
                        updates.push("name = ?");
                        values.push(name);
                    }
                    if (phone) {
                        updates.push("phone = ?");
                        values.push(phone);
                    }

                    if (updates.length > 0) {
                        updates.push("updated_at = CURRENT_TIMESTAMP");
                        values.push(payload.userId);
                        await env.proveloce_db.prepare(
                            `UPDATE users SET ${updates.join(", ")} WHERE id = ?`
                        ).bind(...values).run();
                    }
                }

                // Upsert user profile (profile-specific fields)
                const existingProfile = await env.proveloce_db.prepare(
                    "SELECT id FROM user_profiles WHERE user_id = ?"
                ).bind(payload.userId).first();

                if (existingProfile) {
                    await env.proveloce_db.prepare(`
                        UPDATE user_profiles SET 
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
                    `).bind(dob, gender, addressLine1, addressLine2, city, state, country, pincode, bio, payload.userId).run();
                } else {
                    const profileId = crypto.randomUUID();
                    await env.proveloce_db.prepare(`
                        INSERT INTO user_profiles (id, user_id, dob, gender, address_line1, address_line2, city, state, country, pincode, bio)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `).bind(profileId, payload.userId, dob, gender, addressLine1, addressLine2, city, state, country, pincode, bio).run();
                }

                // Get updated user and profile
                const user = await env.proveloce_db.prepare(
                    "SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?"
                ).bind(payload.userId).first() as any;

                const profile = await env.proveloce_db.prepare(
                    "SELECT * FROM user_profiles WHERE user_id = ?"
                ).bind(payload.userId).first();

                return jsonResponse({
                    success: true,
                    message: "Profile updated successfully",
                    data: {
                        user: {
                            id: user?.id,
                            name: user?.name,
                            email: user?.email,
                            phone: user?.phone || null,
                            role: user?.role,
                            profile
                        }
                    }
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

                if (!name || !email || !phone || !body.password) {
                    return jsonResponse({ success: false, error: "All fields are required (name, email, phone, password)" }, 400);
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

                // Hash password if provided
                const password = body.password || "123user123";
                const encoder = new TextEncoder();
                const data = encoder.encode(password);
                const hashBuffer = await crypto.subtle.digest("SHA-256", data);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const passwordHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

                const id = crypto.randomUUID();
                await env.proveloce_db.prepare(
                    "INSERT INTO users (id, name, email, phone, role, status, email_verified, password_hash) VALUES (?, ?, ?, ?, ?, ?, 1, ?)"
                ).bind(id, name, email, phone || null, newRole, status || "active", passwordHash).run();

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
            // Expert Application Routes
            // =====================================================

            // GET /api/applications - Admin: List all expert applications
            if (url.pathname === "/api/applications" && request.method === "GET") {
                console.log("📋 Admin: Fetching expert applications");

                const authHeader = request.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const token = authHeader.substring(7);
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret");

                if (!payload) {
                    return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
                }

                // Check admin role
                const role = (payload.role || "").toLowerCase();
                if (role !== "admin" && role !== "superadmin") {
                    console.log(`❌ Access denied for role: ${role}`);
                    return jsonResponse({ success: false, error: "Access denied. Admin role required." }, 403);
                }

                if (!env.proveloce_db) {
                    return jsonResponse({ success: false, error: "Database not configured" }, 500);
                }

                // Get status filter from query params
                // Handle malformed status values like "PENDING:1" (cache-busting suffixes)
                let statusFilter = url.searchParams.get("status");
                if (statusFilter && statusFilter.includes(":")) {
                    statusFilter = statusFilter.split(":")[0];
                }
                // Validate status is one of the allowed values
                const validStatuses = ["PENDING", "APPROVED", "REJECTED", "DRAFT", "UNDER_REVIEW", "REQUIRES_CLARIFICATION", ""];
                if (statusFilter && !validStatuses.includes(statusFilter.toUpperCase())) {
                    statusFilter = null;
                }
                console.log(`📊 Status filter: ${statusFilter || 'none'}`);

                try {
                    let query = `
                        SELECT 
                            ea.id,
                            ea.user_id as userId,
                            ea.status,
                            ea.dob,
                            ea.gender,
                            ea.address_line1 as addressLine1,
                            ea.address_line2 as addressLine2,
                            ea.city,
                            ea.state,
                            ea.country,
                            ea.pincode,
                            ea.government_id_type as governmentIdType,
                            ea.government_id_url as governmentIdUrl,
                            ea.profile_photo_url as profilePhotoUrl,
                            ea.domains,
                            ea.skills,
                            ea.years_of_experience as yearsOfExperience,
                            ea.summary_bio as summaryBio,
                            ea.resume_url as resumeUrl,
                            ea.portfolio_urls as portfolioUrls,
                            ea.certification_urls as certificationUrls,
                            ea.working_type as workingType,
                            ea.hourly_rate as hourlyRate,
                            ea.languages,
                            ea.available_days as availableDays,
                            ea.available_time_slots as availableTimeSlots,
                            ea.work_preference as workPreference,
                            ea.communication_mode as communicationMode,
                            ea.terms_accepted as termsAccepted,
                            ea.nda_accepted as ndaAccepted,
                            ea.signature_url as signatureUrl,
                            ea.rejection_reason as rejectionReason,
                            ea.reviewed_by as reviewedBy,
                            ea.reviewed_at as reviewedAt,
                            ea.created_at as createdAt,
                            ea.submitted_at as submittedAt,
                            ea.updated_at as updatedAt,
                            u.id as "user.id",
                            u.name as "user.name",
                            u.email as "user.email",
                            u.phone as "user.phone"
                        FROM expert_applications ea
                        JOIN users u ON u.id = ea.user_id
                    `;
                    const params: any[] = [];

                    if (statusFilter && statusFilter !== "") {
                        query += ` WHERE LOWER(ea.status) = LOWER(?)`;
                        params.push(statusFilter);
                    }

                    query += ` ORDER BY ea.created_at DESC LIMIT 100`;

                    const result = await env.proveloce_db.prepare(query).bind(...params).all();
                    console.log(`✅ Found ${result.results.length} applications`);

                    // Transform to expected format with nested user object
                    const applications = result.results.map((row: any) => {
                        // Parse JSON fields
                        let domains = [];
                        let skills = [];
                        let availableDays = [];
                        let availableTimeSlots = [];

                        try { domains = row.domains ? JSON.parse(row.domains) : []; } catch { }
                        try { skills = row.skills ? JSON.parse(row.skills) : []; } catch { }
                        try { availableDays = row.availableDays ? JSON.parse(row.availableDays) : []; } catch { }
                        try { availableTimeSlots = row.availableTimeSlots ? JSON.parse(row.availableTimeSlots) : []; } catch { }

                        // Parse additional JSON fields
                        let portfolioUrls = [];
                        let certificationUrls = [];
                        let languages = [];
                        try { portfolioUrls = row.portfolioUrls ? JSON.parse(row.portfolioUrls) : []; } catch { }
                        try { certificationUrls = row.certificationUrls ? JSON.parse(row.certificationUrls) : []; } catch { }
                        try { languages = row.languages ? JSON.parse(row.languages) : []; } catch { }

                        return {
                            id: row.id,
                            userId: row.userId,
                            status: (row.status || 'DRAFT').toUpperCase(),
                            dob: row.dob,
                            gender: row.gender,
                            addressLine1: row.addressLine1,
                            addressLine2: row.addressLine2,
                            city: row.city,
                            state: row.state,
                            country: row.country,
                            pincode: row.pincode,
                            governmentIdType: row.governmentIdType,
                            governmentIdUrl: row.governmentIdUrl,
                            profilePhotoUrl: row.profilePhotoUrl,
                            domains,
                            skills,
                            yearsOfExperience: row.yearsOfExperience,
                            summaryBio: row.summaryBio,
                            resumeUrl: row.resumeUrl,
                            portfolioUrls,
                            certificationUrls,
                            workingType: row.workingType,
                            hourlyRate: row.hourlyRate,
                            languages,
                            availableDays,
                            availableTimeSlots,
                            workPreference: row.workPreference,
                            communicationMode: row.communicationMode,
                            termsAccepted: row.termsAccepted,
                            ndaAccepted: row.ndaAccepted,
                            signatureUrl: row.signatureUrl,
                            rejectionReason: row.rejectionReason,
                            reviewedBy: row.reviewedBy,
                            reviewedAt: row.reviewedAt,
                            createdAt: row.createdAt,
                            submittedAt: row.submittedAt,
                            updatedAt: row.updatedAt,
                            user: {
                                id: row["user.id"],
                                name: row["user.name"],
                                email: row["user.email"],
                                phone: row["user.phone"],
                            },
                        };
                    });

                    return jsonResponse({
                        success: true,
                        data: {
                            applications,
                            count: applications.length,
                        },
                    });
                } catch (error: any) {
                    console.error("Error fetching applications:", error);
                    // Return empty array instead of 500 error
                    return jsonResponse({
                        success: true,
                        data: {
                            applications: [],
                            count: 0,
                        },
                    });
                }
            }

            // GET /api/applications/:id - Admin: Get single application with all details and documents
            if (url.pathname.match(/^\/api\/applications\/[^\/]+$/) && request.method === "GET") {
                const authHeader = request.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const token = authHeader.substring(7);
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret");

                if (!payload) {
                    return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
                }

                const role = (payload.role || "").toLowerCase();
                if (role !== "admin" && role !== "superadmin") {
                    return jsonResponse({ success: false, error: "Access denied" }, 403);
                }

                const pathParts = url.pathname.split("/");
                const applicationId = pathParts[3];

                if (!env.proveloce_db) {
                    return jsonResponse({ success: false, error: "Database not configured" }, 500);
                }

                try {
                    // Fetch complete application with user info
                    const app = await env.proveloce_db.prepare(`
                        SELECT 
                            ea.*,
                            u.name as user_name,
                            u.email as user_email,
                            u.phone as user_phone
                        FROM expert_applications ea
                        JOIN users u ON u.id = ea.user_id
                        WHERE ea.id = ?
                    `).bind(applicationId).first() as any;

                    if (!app) {
                        return jsonResponse({ success: false, error: "Application not found" }, 404);
                    }

                    // Fetch all documents for this application
                    const docsResult = await env.proveloce_db.prepare(`
                        SELECT * FROM expert_documents WHERE application_id = ? OR user_id = ?
                    `).bind(applicationId, app.user_id).all();

                    // Generate signed URLs for each document
                    const documents: any[] = [];
                    for (const doc of docsResult.results as any[]) {
                        let signedUrl = null;
                        if (doc.r2_object_key && env.EXPERT_APPLICATION) {
                            try {
                                const object = await env.EXPERT_APPLICATION.head(doc.r2_object_key);
                                if (object) {
                                    // Generate a simple presigned-like URL (for display)
                                    signedUrl = `https://backend.proveloce.com/api/documents/${doc.id}/download`;
                                }
                            } catch (e) {
                                console.log(`Could not find R2 object: ${doc.r2_object_key}`);
                            }
                        }
                        documents.push({
                            id: doc.id,
                            type: doc.document_type,
                            fileName: doc.file_name,
                            r2Key: doc.r2_object_key,
                            url: signedUrl,
                            reviewStatus: doc.review_status,
                            uploadedAt: doc.uploaded_at,
                        });
                    }

                    // Parse JSON fields
                    let domains = [], skills = [], languages = [], availableDays = [], availableTimeSlots = [];
                    let portfolioUrls = [], certificationUrls = [];
                    try { domains = app.domains ? JSON.parse(app.domains) : []; } catch { }
                    try { skills = app.skills ? JSON.parse(app.skills) : []; } catch { }
                    try { languages = app.languages ? JSON.parse(app.languages) : []; } catch { }
                    try { availableDays = app.available_days ? JSON.parse(app.available_days) : []; } catch { }
                    try { availableTimeSlots = app.available_time_slots ? JSON.parse(app.available_time_slots) : []; } catch { }
                    try { portfolioUrls = app.portfolio_urls ? JSON.parse(app.portfolio_urls) : []; } catch { }
                    try { certificationUrls = app.certification_urls ? JSON.parse(app.certification_urls) : []; } catch { }

                    const application = {
                        id: app.id,
                        userId: app.user_id,
                        status: (app.status || 'DRAFT').toUpperCase(),

                        // Personal Info
                        user: {
                            name: app.user_name,
                            email: app.user_email,
                            phone: app.user_phone,
                        },
                        dob: app.dob,
                        gender: app.gender,
                        address: {
                            line1: app.address_line1,
                            line2: app.address_line2,
                            city: app.city,
                            state: app.state,
                            country: app.country,
                            pincode: app.pincode,
                        },

                        // Professional Info
                        governmentIdType: app.government_id_type,
                        domains,
                        skills,
                        yearsOfExperience: app.years_of_experience,
                        summaryBio: app.summary_bio,
                        workingType: app.working_type,
                        hourlyRate: app.hourly_rate,
                        projectRate: app.project_rate,
                        languages,
                        portfolioUrls,

                        // Availability
                        availableDays,
                        availableTimeSlots,
                        workPreference: app.work_preference,
                        communicationMode: app.communication_mode,

                        // Legal
                        termsAccepted: !!app.terms_accepted,
                        ndaAccepted: !!app.nda_accepted,
                        signatureUrl: app.signature_url,

                        // Documents (from R2)
                        documents,
                        profilePhotoUrl: app.profile_photo_url,
                        governmentIdUrl: app.government_id_url,
                        resumeUrl: app.resume_url,
                        certificationUrls,

                        // Timestamps
                        createdAt: app.created_at,
                        updatedAt: app.updated_at,
                        submittedAt: app.submitted_at,

                        // Review Info
                        reviewedBy: app.reviewed_by,
                        reviewedAt: app.reviewed_at,
                        rejectionReason: app.rejection_reason,
                        internalNotes: app.internal_notes,
                    };

                    return jsonResponse({
                        success: true,
                        data: { application }
                    });
                } catch (error: any) {
                    console.error("Error fetching application details:", error);
                    return jsonResponse({ success: false, error: "Failed to fetch application" }, 500);
                }
            }

            // POST /api/applications/:id/approve - Approve application
            if (url.pathname.match(/^\/api\/applications\/[^\/]+\/approve$/) && request.method === "POST") {
                const authHeader = request.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const token = authHeader.substring(7);
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret");

                if (!payload) {
                    return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
                }

                const role = (payload.role || "").toLowerCase();
                if (role !== "admin" && role !== "superadmin") {
                    return jsonResponse({ success: false, error: "Access denied" }, 403);
                }

                const pathParts = url.pathname.split("/");
                const applicationId = pathParts[3];

                if (!env.proveloce_db) {
                    return jsonResponse({ success: false, error: "Database not configured" }, 500);
                }

                // Get the application to find user_id
                const app = await env.proveloce_db.prepare(
                    "SELECT user_id FROM expert_applications WHERE id = ?"
                ).bind(applicationId).first() as any;

                if (!app) {
                    return jsonResponse({ success: false, error: "Application not found" }, 404);
                }

                // Update application status
                await env.proveloce_db.prepare(
                    "UPDATE expert_applications SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
                ).bind(applicationId).run();

                // Update user role to EXPERT
                await env.proveloce_db.prepare(
                    "UPDATE users SET role = 'expert', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
                ).bind(app.user_id).run();

                // Log activity
                await env.proveloce_db.prepare(
                    "INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?, ?)"
                ).bind(crypto.randomUUID(), payload.userId, "APPROVE_EXPERT_APPLICATION", "expert_application", applicationId, JSON.stringify({ approvedBy: payload.userId })).run();

                return jsonResponse({ success: true, message: "Application approved" });
            }

            // POST /api/applications/:id/reject - Reject application
            if (url.pathname.match(/^\/api\/applications\/[^\/]+\/reject$/) && request.method === "POST") {
                const authHeader = request.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const token = authHeader.substring(7);
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret");

                if (!payload) {
                    return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
                }

                const role = (payload.role || "").toLowerCase();
                if (role !== "admin" && role !== "superadmin") {
                    return jsonResponse({ success: false, error: "Access denied" }, 403);
                }

                const pathParts = url.pathname.split("/");
                const applicationId = pathParts[3];

                const body = await request.json() as any;
                const reason = body.reason || "No reason provided";

                if (!env.proveloce_db) {
                    return jsonResponse({ success: false, error: "Database not configured" }, 500);
                }

                await env.proveloce_db.prepare(
                    "UPDATE expert_applications SET status = 'rejected', rejection_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
                ).bind(reason, applicationId).run();

                // Log activity
                await env.proveloce_db.prepare(
                    "INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?, ?)"
                ).bind(crypto.randomUUID(), payload.userId, "REJECT_EXPERT_APPLICATION", "expert_application", applicationId, JSON.stringify({ rejectedBy: payload.userId, reason })).run();

                return jsonResponse({ success: true, message: "Application rejected" });
            }

            // POST /api/applications/:id/remove - Remove/revoke an approved expert
            if (url.pathname.match(/^\/api\/applications\/[^\/]+\/remove$/) && request.method === "POST") {
                const authHeader = request.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const token = authHeader.substring(7);
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret");

                if (!payload) {
                    return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
                }

                const role = (payload.role || "").toLowerCase();
                if (role !== "admin" && role !== "superadmin") {
                    return jsonResponse({ success: false, error: "Access denied" }, 403);
                }

                const pathParts = url.pathname.split("/");
                const applicationId = pathParts[3];

                const body = await request.json() as any;
                const reason = body.reason || "No reason provided";
                const permanentBan = body.permanentBan || false;

                if (!env.proveloce_db) {
                    return jsonResponse({ success: false, error: "Database not configured" }, 500);
                }

                try {
                    // Get the application to find user_id
                    const app = await env.proveloce_db.prepare(
                        "SELECT user_id, status FROM expert_applications WHERE id = ?"
                    ).bind(applicationId).first() as any;

                    if (!app) {
                        return jsonResponse({ success: false, error: "Application not found" }, 404);
                    }

                    // Only allow removing approved experts
                    if ((app.status || '').toLowerCase() !== 'approved') {
                        return jsonResponse({
                            success: false,
                            error: "Can only remove approved experts. Current status: " + app.status
                        }, 400);
                    }

                    // Update application status to REVOKED
                    await env.proveloce_db.prepare(`
                        UPDATE expert_applications 
                        SET status = 'revoked', 
                            rejection_reason = ?, 
                            reviewed_by = ?,
                            reviewed_at = CURRENT_TIMESTAMP,
                            updated_at = CURRENT_TIMESTAMP 
                        WHERE id = ?
                    `).bind(reason, payload.userId, applicationId).run();

                    // Revert user role back to customer (or suspended if permanent ban)
                    const newRole = permanentBan ? 'suspended' : 'customer';
                    await env.proveloce_db.prepare(
                        "UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
                    ).bind(newRole, app.user_id).run();

                    // Log activity
                    await env.proveloce_db.prepare(
                        "INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?, ?)"
                    ).bind(
                        crypto.randomUUID(),
                        payload.userId,
                        "REMOVE_EXPERT",
                        "expert_application",
                        applicationId,
                        JSON.stringify({ removedBy: payload.userId, reason, permanentBan })
                    ).run();

                    return jsonResponse({
                        success: true,
                        message: permanentBan ? "Expert removed and permanently banned" : "Expert removed"
                    });
                } catch (error: any) {
                    console.error("Error removing expert:", error);
                    return jsonResponse({ success: false, error: "Failed to remove expert" }, 500);
                }
            }

            // GET /api/expert-application - Get current user's application
            if (url.pathname === "/api/expert-application" && request.method === "GET") {
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

                try {
                    let application = await env.proveloce_db.prepare(
                        "SELECT * FROM expert_applications WHERE user_id = ?"
                    ).bind(payload.userId).first();

                    // AUTO-CREATE: If no application exists, create one with DRAFT status
                    if (!application) {
                        const newId = crypto.randomUUID();
                        await env.proveloce_db.prepare(`
                            INSERT INTO expert_applications (id, user_id, status, created_at, updated_at)
                            VALUES (?, ?, 'draft', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                        `).bind(newId, payload.userId).run();

                        application = {
                            id: newId,
                            user_id: payload.userId,
                            status: 'draft',
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        };
                        console.log(`✅ Auto-created DRAFT application for user ${payload.userId}`);
                    }

                    return jsonResponse({
                        success: true,
                        data: { application }
                    });
                } catch (error: any) {
                    console.error("Error fetching/creating application:", error);
                    return jsonResponse({ success: false, error: "Failed to fetch application" }, 500);
                }
            }

            // POST /api/expert-application - Save/update draft
            if (url.pathname === "/api/expert-application" && request.method === "POST") {
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

                try {
                    const body = await request.json() as any;

                    // Check if application exists and its current status
                    const existing = await env.proveloce_db.prepare(
                        "SELECT id, status FROM expert_applications WHERE user_id = ?"
                    ).bind(payload.userId).first() as any;

                    // GUARD: Don't allow overwriting PENDING or APPROVED applications
                    if (existing) {
                        const currentStatus = (existing.status || '').toLowerCase();
                        if (currentStatus === 'pending') {
                            return jsonResponse({
                                success: false,
                                error: "Cannot modify application while it's under review"
                            }, 400);
                        }
                        if (currentStatus === 'approved') {
                            return jsonResponse({
                                success: false,
                                error: "Your application has already been approved"
                            }, 400);
                        }

                        // Update existing application - ALWAYS set status to 'draft' when saving
                        await env.proveloce_db.prepare(`
                            UPDATE expert_applications SET
                                status = 'draft',
                                dob = ?, gender = ?, address_line1 = ?, address_line2 = ?,
                                city = ?, state = ?, country = ?, pincode = ?,
                                government_id_type = ?, government_id_url = ?, profile_photo_url = ?,
                                domains = ?, years_of_experience = ?, summary_bio = ?, skills = ?,
                                resume_url = ?, portfolio_urls = ?, certification_urls = ?,
                                working_type = ?, hourly_rate = ?, languages = ?,
                                available_days = ?, available_time_slots = ?,
                                work_preference = ?, communication_mode = ?,
                                terms_accepted = ?, nda_accepted = ?, signature_url = ?,
                                updated_at = CURRENT_TIMESTAMP
                            WHERE user_id = ?
                        `).bind(
                            body.dob || null, body.gender || null, body.addressLine1 || null, body.addressLine2 || null,
                            body.city || null, body.state || null, body.country || null, body.pincode || null,
                            body.governmentIdType || null, body.governmentIdUrl || null, body.profilePhotoUrl || null,
                            JSON.stringify(body.domains || []), body.yearsOfExperience || 0, body.summaryBio || null, JSON.stringify(body.skills || []),
                            body.resumeUrl || null, JSON.stringify(body.portfolioLinks || []), JSON.stringify(body.certificationUrls || []),
                            body.workingType || null, body.expectedRate || null, JSON.stringify(body.languages || []),
                            JSON.stringify(body.availableDays || []), JSON.stringify(body.availableTimeSlots || []),
                            body.workPreference || null, body.communicationMode || null,
                            body.termsAccepted ? 1 : 0, body.ndaAccepted ? 1 : 0, body.signatureUrl || null,
                            payload.userId
                        ).run();
                    } else {
                        // Create new application with DRAFT status
                        const id = crypto.randomUUID();
                        await env.proveloce_db.prepare(`
                            INSERT INTO expert_applications (
                                id, user_id, status,
                                dob, gender, address_line1, address_line2,
                                city, state, country, pincode,
                                government_id_type, government_id_url, profile_photo_url,
                                domains, years_of_experience, summary_bio, skills,
                                resume_url, portfolio_urls, certification_urls,
                                working_type, hourly_rate, languages,
                                available_days, available_time_slots,
                                work_preference, communication_mode,
                                terms_accepted, nda_accepted, signature_url
                            ) VALUES (?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `).bind(
                            id, payload.userId,
                            body.dob || null, body.gender || null, body.addressLine1 || null, body.addressLine2 || null,
                            body.city || null, body.state || null, body.country || null, body.pincode || null,
                            body.governmentIdType || null, body.governmentIdUrl || null, body.profilePhotoUrl || null,
                            JSON.stringify(body.domains || []), body.yearsOfExperience || 0, body.summaryBio || null, JSON.stringify(body.skills || []),
                            body.resumeUrl || null, JSON.stringify(body.portfolioLinks || []), JSON.stringify(body.certificationUrls || []),
                            body.workingType || null, body.expectedRate || null, JSON.stringify(body.languages || []),
                            JSON.stringify(body.availableDays || []), JSON.stringify(body.availableTimeSlots || []),
                            body.workPreference || null, body.communicationMode || null,
                            body.termsAccepted ? 1 : 0, body.ndaAccepted ? 1 : 0, body.signatureUrl || null
                        ).run();
                    }

                    console.log(`✅ Draft saved for user ${payload.userId}`);
                    return jsonResponse({ success: true, message: "Application saved successfully" });
                } catch (error: any) {
                    console.error("Error saving application draft:", error);
                    return jsonResponse({ success: false, error: "Failed to save application" }, 500);
                }
            }

            // POST /api/expert-application/submit - Submit application
            if (url.pathname === "/api/expert-application/submit" && request.method === "POST") {
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

                try {
                    // First check if application exists and its current status
                    const existing = await env.proveloce_db.prepare(
                        "SELECT id, status FROM expert_applications WHERE user_id = ?"
                    ).bind(payload.userId).first() as any;

                    if (!existing) {
                        return jsonResponse({
                            success: false,
                            error: "No application found. Please save a draft first."
                        }, 404);
                    }

                    const currentStatus = (existing.status || '').toLowerCase();

                    // GUARD: Only allow submitting if status is DRAFT or REJECTED (reapply)
                    if (currentStatus === 'pending') {
                        return jsonResponse({
                            success: false,
                            error: "Application already submitted and under review"
                        }, 400);
                    }
                    if (currentStatus === 'approved') {
                        return jsonResponse({
                            success: false,
                            error: "Your application has already been approved"
                        }, 400);
                    }

                    // Update status to pending
                    await env.proveloce_db.prepare(`
                        UPDATE expert_applications 
                        SET status = 'pending', submitted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                        WHERE user_id = ?
                    `).bind(payload.userId).run();

                    // Log activity
                    await env.proveloce_db.prepare(
                        "INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?, ?)"
                    ).bind(crypto.randomUUID(), payload.userId, "SUBMIT_EXPERT_APPLICATION", "expert_application", existing.id, JSON.stringify({ timestamp: new Date().toISOString() })).run();

                    console.log(`✅ Application submitted for user ${payload.userId}`);
                    return jsonResponse({ success: true, message: "Application submitted successfully" });
                } catch (error: any) {
                    console.error("Error submitting application:", error);
                    return jsonResponse({ success: false, error: "Failed to submit application" }, 500);
                }
            }

            // =====================================================
            // Document Upload Routes (R2 Storage)
            // =====================================================

            // POST /api/documents/upload - Upload file to R2
            if (url.pathname === "/api/documents/upload" && request.method === "POST") {
                console.log("📁 Document upload request received");

                const authHeader = request.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const token = authHeader.substring(7);
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret");

                if (!payload) {
                    return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
                }

                // Check R2 bucket binding
                if (!env.EXPERT_APPLICATION) {
                    console.error("❌ R2 bucket EXPERT_APPLICATION not bound");
                    return jsonResponse({ success: false, error: "R2 storage not configured" }, 500);
                }

                if (!env.proveloce_db) {
                    return jsonResponse({ success: false, error: "Database not configured" }, 500);
                }

                try {
                    // Parse multipart form data
                    const formData = await request.formData();
                    const file = formData.get("file") as File | null;
                    const documentType = formData.get("documentType") as string || "other";

                    if (!file) {
                        return jsonResponse({ success: false, error: "No file provided" }, 400);
                    }

                    console.log(`📄 Uploading file: ${file.name}, type: ${file.type}, size: ${file.size}`);

                    // Validate file size (10MB max)
                    const MAX_SIZE = 10 * 1024 * 1024;
                    if (file.size > MAX_SIZE) {
                        return jsonResponse({ success: false, error: "File size exceeds 10MB limit" }, 400);
                    }

                    // Validate file type
                    const allowedTypes = [
                        'image/jpeg', 'image/png', 'image/webp',
                        'application/pdf',
                        'application/msword',
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                    ];
                    if (!allowedTypes.includes(file.type)) {
                        return jsonResponse({ success: false, error: `File type ${file.type} not allowed` }, 400);
                    }

                    // Generate unique object key
                    const timestamp = Date.now();
                    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                    const objectKey = `experts/${payload.userId}/${documentType}/${timestamp}_${sanitizedName}`;

                    console.log(`🔑 R2 Object Key: ${objectKey}`);

                    // Upload to R2
                    await env.EXPERT_APPLICATION.put(objectKey, file.stream(), {
                        httpMetadata: {
                            contentType: file.type,
                        },
                        customMetadata: {
                            userId: payload.userId,
                            documentType: documentType,
                            originalName: file.name,
                        },
                    });

                    console.log(`✅ File uploaded to R2: ${objectKey}`);

                    // Get or create application_id for this user
                    let applicationId: string | null = null;
                    const existingApp = await env.proveloce_db.prepare(
                        "SELECT id FROM expert_applications WHERE user_id = ?"
                    ).bind(payload.userId).first() as any;

                    if (existingApp) {
                        applicationId = existingApp.id;
                    }

                    // Save metadata to D1 with application_id
                    const docId = crypto.randomUUID();
                    await env.proveloce_db.prepare(`
                        INSERT INTO expert_documents (
                            id, user_id, application_id, document_type, file_name, 
                            file_type, file_size, r2_object_key, 
                            review_status, application_status, uploaded_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'draft', datetime('now'), datetime('now'))
                    `).bind(
                        docId,
                        payload.userId,
                        applicationId,
                        documentType,
                        file.name,
                        file.type,
                        file.size,
                        objectKey
                    ).run();

                    console.log(`✅ Document metadata saved to D1: ${docId}, linked to application: ${applicationId}`);

                    return jsonResponse({
                        success: true,
                        message: "File uploaded successfully",
                        data: {
                            document: {
                                id: docId,
                                documentType,
                                fileName: file.name,
                                fileType: file.type,
                                fileSize: file.size,
                                reviewStatus: "pending",
                            },
                        },
                    });
                } catch (err: any) {
                    console.error("❌ Upload error:", err);
                    return jsonResponse({ success: false, error: err.message || "Upload failed" }, 500);
                }
            }

            // GET /api/documents/my-documents - Get user's documents
            if (url.pathname === "/api/documents/my-documents" && request.method === "GET") {
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

                const docs = await env.proveloce_db.prepare(`
                    SELECT id, document_type, file_name, file_type, file_size, 
                           r2_object_key, review_status, application_status, uploaded_at
                    FROM expert_documents 
                    WHERE user_id = ? 
                    ORDER BY uploaded_at DESC
                `).bind(payload.userId).all();

                return jsonResponse({
                    success: true,
                    data: {
                        documents: docs.results,
                        count: docs.results.length,
                    },
                });
            }

            // GET /api/documents/:id/url - Get signed URL for document
            if (url.pathname.match(/^\/api\/documents\/[^\/]+\/url$/) && request.method === "GET") {
                const authHeader = request.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const token = authHeader.substring(7);
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret");

                if (!payload) {
                    return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
                }

                const pathParts = url.pathname.split("/");
                const docId = pathParts[3];

                if (!env.proveloce_db) {
                    return jsonResponse({ success: false, error: "Database not configured" }, 500);
                }

                const doc = await env.proveloce_db.prepare(`
                    SELECT id, user_id, document_type, file_name, file_type, r2_object_key
                    FROM expert_documents 
                    WHERE id = ?
                `).bind(docId).first() as any;

                if (!doc) {
                    return jsonResponse({ success: false, error: "Document not found" }, 404);
                }

                // Check access: user can only access their own documents
                const role = (payload.role || "").toLowerCase();
                if (doc.user_id !== payload.userId && role !== "admin" && role !== "superadmin") {
                    return jsonResponse({ success: false, error: "Access denied" }, 403);
                }

                // Generate signed URL token (10 min expiry)
                const expiresAt = Date.now() + (10 * 60 * 1000);
                const signedPayload = {
                    docId: doc.id,
                    objectKey: doc.r2_object_key,
                    expiresAt,
                };
                const signedToken = btoa(JSON.stringify(signedPayload));

                return jsonResponse({
                    success: true,
                    data: {
                        document: doc,
                        url: `/api/documents/${doc.id}/stream?token=${signedToken}`,
                        expiresIn: 600,
                    },
                });
            }

            // GET /api/documents/:id/stream - Stream document content
            if (url.pathname.match(/^\/api\/documents\/[^\/]+\/stream$/) && request.method === "GET") {
                const signedToken = url.searchParams.get("token");
                if (!signedToken) {
                    return jsonResponse({ success: false, error: "Missing token" }, 401);
                }

                try {
                    const tokenData = JSON.parse(atob(signedToken));

                    if (Date.now() > tokenData.expiresAt) {
                        return jsonResponse({ success: false, error: "Token expired" }, 401);
                    }

                    if (!env.EXPERT_APPLICATION) {
                        return jsonResponse({ success: false, error: "R2 not configured" }, 500);
                    }

                    const object = await env.EXPERT_APPLICATION.get(tokenData.objectKey);
                    if (!object) {
                        return jsonResponse({ success: false, error: "File not found" }, 404);
                    }

                    return new Response(object.body, {
                        headers: {
                            "Content-Type": object.httpMetadata?.contentType || "application/octet-stream",
                            "Content-Disposition": `inline; filename="${tokenData.objectKey.split('/').pop()}"`,
                            ...corsHeaders,
                        },
                    });
                } catch {
                    return jsonResponse({ success: false, error: "Invalid token" }, 401);
                }
            }

            // POST /api/documents/submit - Submit all draft documents
            if (url.pathname === "/api/documents/submit" && request.method === "POST") {
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

                // Update all draft documents to submitted
                const result = await env.proveloce_db.prepare(`
                    UPDATE expert_documents 
                    SET application_status = 'submitted', updated_at = datetime('now')
                    WHERE user_id = ? AND application_status = 'draft'
                `).bind(payload.userId).run();

                return jsonResponse({
                    success: true,
                    message: `${result.changes} document(s) submitted for review`,
                    data: { submittedCount: result.changes },
                });
            }

            // GET /api/admin/applications/:id/documents - Admin get documents for an application
            if (url.pathname.match(/^\/api\/admin\/applications\/[^\/]+\/documents$/) && request.method === "GET") {
                const authHeader = request.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const token = authHeader.substring(7);
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret");

                if (!payload) {
                    return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
                }

                // Check admin role
                const role = (payload.role || "").toLowerCase();
                if (role !== "admin" && role !== "superadmin") {
                    return jsonResponse({ success: false, error: "Admin access required" }, 403);
                }

                const pathParts = url.pathname.split("/");
                const applicationId = pathParts[4];

                if (!env.proveloce_db) {
                    return jsonResponse({ success: false, error: "Database not configured" }, 500);
                }

                // Get all documents for this application
                const docs = await env.proveloce_db.prepare(`
                    SELECT ed.*, ea.status as application_status_main, u.name as user_name, u.email as user_email
                    FROM expert_documents ed
                    LEFT JOIN expert_applications ea ON ed.application_id = ea.id
                    LEFT JOIN users u ON ed.user_id = u.id
                    WHERE ed.application_id = ?
                    ORDER BY ed.uploaded_at DESC
                `).bind(applicationId).all();

                return jsonResponse({
                    success: true,
                    data: {
                        documents: docs.results,
                        count: docs.results.length,
                    },
                });
            }

            // GET /api/admin/documents - Admin get all documents with application info
            if (url.pathname === "/api/admin/documents" && request.method === "GET") {
                const authHeader = request.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const token = authHeader.substring(7);
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret");

                if (!payload) {
                    return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
                }

                // Check admin role
                const role = (payload.role || "").toLowerCase();
                if (role !== "admin" && role !== "superadmin") {
                    return jsonResponse({ success: false, error: "Admin access required" }, 403);
                }

                if (!env.proveloce_db) {
                    return jsonResponse({ success: false, error: "Database not configured" }, 500);
                }

                // Get filter from query params
                const status = url.searchParams.get("status") || "";

                let query = `
                    SELECT ed.*, ea.status as app_status, u.name as user_name, u.email as user_email
                    FROM expert_documents ed
                    LEFT JOIN expert_applications ea ON ed.application_id = ea.id
                    LEFT JOIN users u ON ed.user_id = u.id
                `;

                if (status) {
                    query += ` WHERE ea.status = '${status}'`;
                }

                query += ` ORDER BY ed.uploaded_at DESC LIMIT 100`;

                const docs = await env.proveloce_db.prepare(query).all();

                return jsonResponse({
                    success: true,
                    data: {
                        documents: docs.results,
                        count: docs.results.length,
                    },
                });
            }

            // DELETE /api/documents/:id - Delete document from R2 and D1 (atomic)
            if (url.pathname.match(/^\/api\/documents\/[^\/]+$/) && request.method === "DELETE") {
                const authHeader = request.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const token = authHeader.substring(7);
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret");

                if (!payload) {
                    return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
                }

                const pathParts = url.pathname.split("/");
                const documentId = pathParts[3];

                if (!env.proveloce_db || !env.EXPERT_APPLICATION) {
                    return jsonResponse({ success: false, error: "Storage not configured" }, 500);
                }

                try {
                    // 1. First lookup the document to get R2 key and verify ownership
                    const doc = await env.proveloce_db.prepare(`
                        SELECT id, user_id, r2_object_key, file_name, document_type
                        FROM expert_documents
                        WHERE id = ?
                    `).bind(documentId).first() as any;

                    if (!doc) {
                        return jsonResponse({ success: false, error: "Document not found" }, 404);
                    }

                    // Check access: user can only delete their own documents unless admin
                    const role = (payload.role || "").toLowerCase();
                    if (doc.user_id !== payload.userId && role !== "admin" && role !== "superadmin") {
                        return jsonResponse({ success: false, error: "Access denied" }, 403);
                    }

                    // 2. Delete from R2 FIRST (before database)
                    const r2Key = doc.r2_object_key;
                    console.log(`🗑️ Deleting from R2: ${r2Key}`);

                    try {
                        await env.EXPERT_APPLICATION.delete(r2Key);
                        console.log(`✅ R2 deletion successful: ${r2Key}`);
                    } catch (r2Error: any) {
                        console.error(`❌ R2 deletion failed: ${r2Error.message}`);
                        return jsonResponse({
                            success: false,
                            error: "Failed to delete file from storage"
                        }, 500);
                    }

                    // 3. After R2 success, delete from D1
                    console.log(`🗑️ Deleting from D1: ${documentId}`);
                    await env.proveloce_db.prepare(`
                        DELETE FROM expert_documents WHERE id = ?
                    `).bind(documentId).run();
                    console.log(`✅ D1 deletion successful: ${documentId}`);

                    // 4. Log the deletion for audit trail
                    console.log(`📋 AUDIT: User ${payload.userId} (${role}) deleted document ${documentId} (${doc.file_name}) with R2 key ${r2Key}`);

                    return jsonResponse({
                        success: true,
                        message: "Document deleted successfully",
                        data: {
                            deletedId: documentId,
                            deletedFile: doc.file_name,
                            deletedBy: payload.userId,
                            deletedAt: new Date().toISOString(),
                        },
                    });
                } catch (error: any) {
                    console.error("❌ Document deletion error:", error);
                    return jsonResponse({
                        success: false,
                        error: error.message || "Failed to delete document"
                    }, 500);
                }
            }

            // =====================================================
            // TASK MANAGEMENT APIs (Admin/SuperAdmin)
            // =====================================================

            // POST /api/tasks - Create task and optionally assign to experts
            if (url.pathname === "/api/tasks" && request.method === "POST") {
                const authHeader = request.headers.get("Authorization") || "";
                const token = authHeader.replace("Bearer ", "");
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret") as { userId: string; role?: string } | null;
                if (!payload) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                // Only Admin or SuperAdmin can create tasks
                const user = await env.proveloce_db.prepare(
                    "SELECT role FROM users WHERE id = ?"
                ).bind(payload.userId).first() as any;

                const role = user?.role?.toLowerCase() || '';
                if (role !== 'admin' && role !== 'superadmin') {
                    return jsonResponse({ success: false, error: "Only Admin or SuperAdmin can create tasks" }, 403);
                }

                try {
                    const body = await request.json() as any;
                    const { title, description, domain, deadline, price_budget, priority, expert_ids } = body;

                    if (!title) {
                        return jsonResponse({ success: false, error: "Title is required" }, 400);
                    }

                    const taskId = crypto.randomUUID();

                    // Create the task
                    await env.proveloce_db.prepare(`
                        INSERT INTO tasks (id, title, description, domain, deadline, price_budget, priority, status, admin_id, created_by_id, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    `).bind(
                        taskId,
                        title,
                        description || null,
                        domain || null,
                        deadline || null,
                        price_budget || null,
                        priority || 'MEDIUM',
                        payload.userId,
                        payload.userId
                    ).run();

                    // If expert_ids provided, create expert_tasks assignments
                    let assignedCount = 0;
                    if (expert_ids && Array.isArray(expert_ids) && expert_ids.length > 0) {
                        for (const expertId of expert_ids) {
                            try {
                                await env.proveloce_db.prepare(`
                                    INSERT INTO expert_tasks (id, task_id, expert_id, admin_id, status, created_at, updated_at)
                                    VALUES (?, ?, ?, ?, 'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                                `).bind(crypto.randomUUID(), taskId, expertId, payload.userId).run();
                                assignedCount++;
                            } catch (e) {
                                console.error("Failed to assign expert:", expertId, e);
                            }
                        }
                    }

                    return jsonResponse({
                        success: true,
                        message: "Task created successfully",
                        data: { taskId, assignedCount }
                    });
                } catch (error: any) {
                    console.error("Task creation error:", error);
                    return jsonResponse({ success: false, error: error.message || "Failed to create task" }, 500);
                }
            }

            // GET /api/tasks - Get tasks (role-filtered)
            if (url.pathname === "/api/tasks" && request.method === "GET") {
                const authHeader = request.headers.get("Authorization") || "";
                const token = authHeader.replace("Bearer ", "");
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret") as { userId: string; role?: string } | null;
                if (!payload) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const user = await env.proveloce_db.prepare(
                    "SELECT role FROM users WHERE id = ?"
                ).bind(payload.userId).first() as any;

                const role = user?.role?.toLowerCase() || '';
                let tasks: any[] = [];

                if (role === 'superadmin') {
                    // SuperAdmin sees all tasks
                    const result = await env.proveloce_db.prepare(`
                        SELECT t.*, u.name as admin_name,
                            (SELECT COUNT(*) FROM expert_tasks WHERE task_id = t.id) as assigned_count
                        FROM tasks t
                        LEFT JOIN users u ON t.admin_id = u.id
                        ORDER BY t.created_at DESC
                    `).all();
                    tasks = result.results || [];
                } else if (role === 'admin') {
                    // Admin sees tasks they created
                    const result = await env.proveloce_db.prepare(`
                        SELECT t.*, u.name as admin_name,
                            (SELECT COUNT(*) FROM expert_tasks WHERE task_id = t.id) as assigned_count
                        FROM tasks t
                        LEFT JOIN users u ON t.admin_id = u.id
                        WHERE t.admin_id = ?
                        ORDER BY t.created_at DESC
                    `).bind(payload.userId).all();
                    tasks = result.results || [];
                } else if (role === 'expert') {
                    // Expert sees tasks assigned to them
                    const result = await env.proveloce_db.prepare(`
                        SELECT t.*, et.status as assignment_status, et.id as assignment_id
                        FROM tasks t
                        JOIN expert_tasks et ON et.task_id = t.id
                        WHERE et.expert_id = ?
                        ORDER BY t.created_at DESC
                    `).bind(payload.userId).all();
                    tasks = result.results || [];
                }

                return jsonResponse({
                    success: true,
                    data: { tasks }
                });
            }

            // POST /api/tasks/:id/assign - Assign task to experts
            if (url.pathname.match(/^\/api\/tasks\/[^\/]+\/assign$/) && request.method === "POST") {
                const authHeader = request.headers.get("Authorization") || "";
                const token = authHeader.replace("Bearer ", "");
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret") as { userId: string; role?: string } | null;
                if (!payload) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const user = await env.proveloce_db.prepare(
                    "SELECT role FROM users WHERE id = ?"
                ).bind(payload.userId).first() as any;

                const role = user?.role?.toLowerCase() || '';
                if (role !== 'admin' && role !== 'superadmin') {
                    return jsonResponse({ success: false, error: "Only Admin or SuperAdmin can assign tasks" }, 403);
                }

                const taskId = url.pathname.split('/')[3];
                const body = await request.json() as any;
                const { expert_ids } = body;

                if (!expert_ids || !Array.isArray(expert_ids) || expert_ids.length === 0) {
                    return jsonResponse({ success: false, error: "expert_ids array is required" }, 400);
                }

                let assignedCount = 0;
                for (const expertId of expert_ids) {
                    try {
                        await env.proveloce_db.prepare(`
                            INSERT OR IGNORE INTO expert_tasks (id, task_id, expert_id, admin_id, status, created_at, updated_at)
                            VALUES (?, ?, ?, ?, 'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                        `).bind(crypto.randomUUID(), taskId, expertId, payload.userId).run();
                        assignedCount++;
                    } catch (e) {
                        console.error("Failed to assign expert:", expertId, e);
                    }
                }

                return jsonResponse({
                    success: true,
                    message: `Task assigned to ${assignedCount} experts`,
                    data: { taskId, assignedCount }
                });
            }

            // POST /api/expert/tasks/:id/accept - Expert accepts task
            if (url.pathname.match(/^\/api\/expert\/tasks\/[^\/]+\/accept$/) && request.method === "POST") {
                const authHeader = request.headers.get("Authorization") || "";
                const token = authHeader.replace("Bearer ", "");
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret") as { userId: string } | null;
                if (!payload) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const taskId = url.pathname.split('/')[4];

                await env.proveloce_db.prepare(`
                    UPDATE expert_tasks SET status = 'ACCEPTED', updated_at = CURRENT_TIMESTAMP
                    WHERE task_id = ? AND expert_id = ? AND status = 'PENDING'
                `).bind(taskId, payload.userId).run();

                return jsonResponse({ success: true, message: "Task accepted" });
            }

            // POST /api/expert/tasks/:id/decline - Expert declines task
            if (url.pathname.match(/^\/api\/expert\/tasks\/[^\/]+\/decline$/) && request.method === "POST") {
                const authHeader = request.headers.get("Authorization") || "";
                const token = authHeader.replace("Bearer ", "");
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret") as { userId: string } | null;
                if (!payload) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const taskId = url.pathname.split('/')[4];

                await env.proveloce_db.prepare(`
                    UPDATE expert_tasks SET status = 'DECLINED', updated_at = CURRENT_TIMESTAMP
                    WHERE task_id = ? AND expert_id = ?
                `).bind(taskId, payload.userId).run();

                return jsonResponse({ success: true, message: "Task declined" });
            }

            // POST /api/expert/tasks/:id/complete - Expert marks task complete
            if (url.pathname.match(/^\/api\/expert\/tasks\/[^\/]+\/complete$/) && request.method === "POST") {
                const authHeader = request.headers.get("Authorization") || "";
                const token = authHeader.replace("Bearer ", "");
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret") as { userId: string } | null;
                if (!payload) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const taskId = url.pathname.split('/')[4];

                await env.proveloce_db.prepare(`
                    UPDATE expert_tasks SET status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP
                    WHERE task_id = ? AND expert_id = ? AND status IN ('ACCEPTED', 'IN_PROGRESS')
                `).bind(taskId, payload.userId).run();

                return jsonResponse({ success: true, message: "Task marked as completed" });
            }

            // GET /api/experts - Get list of experts for assignment (Admin/SuperAdmin)
            if (url.pathname === "/api/experts" && request.method === "GET") {
                const authHeader = request.headers.get("Authorization") || "";
                const token = authHeader.replace("Bearer ", "");
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret") as { userId: string } | null;
                if (!payload) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const user = await env.proveloce_db.prepare(
                    "SELECT role FROM users WHERE id = ?"
                ).bind(payload.userId).first() as any;

                const role = user?.role?.toLowerCase() || '';
                if (role !== 'admin' && role !== 'superadmin') {
                    return jsonResponse({ success: false, error: "Only Admin or SuperAdmin can view experts list" }, 403);
                }

                // Get query params for filtering
                const domain = url.searchParams.get('domain');
                const skill = url.searchParams.get('skill');
                const verified = url.searchParams.get('verified');

                let query = `
                    SELECT id, name, email, location, verified, rating, skills, domains, availability
                    FROM users WHERE role = 'expert'
                `;
                const params: any[] = [];

                if (verified === 'true') {
                    query += ` AND verified = 1`;
                }

                query += ` ORDER BY rating DESC NULLS LAST, name ASC`;

                const result = await env.proveloce_db.prepare(query).all();

                // Filter by domain/skill in JS (since they're JSON arrays)
                let experts = (result.results || []) as any[];

                if (domain) {
                    experts = experts.filter(e => {
                        try {
                            const domains = JSON.parse(e.domains || '[]');
                            return domains.includes(domain);
                        } catch { return false; }
                    });
                }

                if (skill) {
                    experts = experts.filter(e => {
                        try {
                            const skills = JSON.parse(e.skills || '[]');
                            return skills.includes(skill);
                        } catch { return false; }
                    });
                }

                return jsonResponse({
                    success: true,
                    data: { experts }
                });
            }

            // =====================================================
            // EXPERT PORTAL APIs
            // =====================================================

            // GET /api/expert/dashboard - Expert dashboard stats
            if (url.pathname === "/api/expert/dashboard" && request.method === "GET") {
                const authHeader = request.headers.get("Authorization") || "";
                const token = authHeader.replace("Bearer ", "");
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret") as { userId: string; role?: string } | null;
                if (!payload) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                // Check if user is an expert
                const user = await env.proveloce_db.prepare(
                    "SELECT role FROM users WHERE id = ?"
                ).bind(payload.userId).first() as any;

                if (!user || user.role?.toLowerCase() !== 'expert') {
                    return jsonResponse({ success: false, error: "Expert access required" }, 403);
                }

                // Get task stats
                const activeTasks = await env.proveloce_db.prepare(
                    "SELECT COUNT(*) as count FROM tasks WHERE assigned_to_id = ? AND status = 'active'"
                ).bind(payload.userId).first() as any;

                const completedTasks = await env.proveloce_db.prepare(
                    "SELECT COUNT(*) as count FROM tasks WHERE assigned_to_id = ? AND status = 'completed'"
                ).bind(payload.userId).first() as any;

                const pendingTasks = await env.proveloce_db.prepare(
                    "SELECT COUNT(*) as count FROM tasks WHERE assigned_to_id = ? AND status = 'pending'"
                ).bind(payload.userId).first() as any;

                // Get earnings
                const earnings = await env.proveloce_db.prepare(
                    "SELECT COALESCE(SUM(net_amount), 0) as total FROM expert_earnings WHERE expert_id = ? AND payment_status = 'paid'"
                ).bind(payload.userId).first() as any;

                return jsonResponse({
                    success: true,
                    data: {
                        stats: {
                            activeTasks: activeTasks?.count || 0,
                            completedTasks: completedTasks?.count || 0,
                            pendingTasks: pendingTasks?.count || 0,
                            totalEarnings: earnings?.total || 0,
                        },
                        recentActivity: [],
                    }
                });
            }

            // GET /api/expert/certifications - Get expert's certifications
            if (url.pathname === "/api/expert/certifications" && request.method === "GET") {
                const authHeader = request.headers.get("Authorization") || "";
                const token = authHeader.replace("Bearer ", "");
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret") as { userId: string } | null;
                if (!payload) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const result = await env.proveloce_db.prepare(`
                    SELECT id, title, issuer, credential_id, credential_url, 
                           issue_date, expiry_date, file_name, file_url, created_at
                    FROM expert_certifications 
                    WHERE expert_id = ?
                    ORDER BY created_at DESC
                `).bind(payload.userId).all();

                return jsonResponse({
                    success: true,
                    data: { certifications: result.results || [] }
                });
            }

            // GET /api/expert/portfolio - Get expert's portfolio items
            if (url.pathname === "/api/expert/portfolio" && request.method === "GET") {
                const authHeader = request.headers.get("Authorization") || "";
                const token = authHeader.replace("Bearer ", "");
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret") as { userId: string } | null;
                if (!payload) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const result = await env.proveloce_db.prepare(`
                    SELECT id, title, description, skills, project_url, created_at
                    FROM expert_portfolio 
                    WHERE expert_id = ?
                    ORDER BY created_at DESC
                `).bind(payload.userId).all();

                // Get files for each portfolio item
                const portfolioItems: any[] = [];
                for (const item of (result.results || []) as any[]) {
                    const files = await env.proveloce_db.prepare(`
                        SELECT id, file_name, file_type, file_url
                        FROM expert_portfolio_files 
                        WHERE portfolio_id = ?
                    `).bind(item.id).all();
                    portfolioItems.push({
                        ...item,
                        skills: item.skills ? JSON.parse(item.skills) : [],
                        files: files.results || [],
                    });
                }

                return jsonResponse({
                    success: true,
                    data: { portfolio: portfolioItems }
                });
            }

            // GET /api/expert/tasks - Get expert's assigned tasks
            if (url.pathname === "/api/expert/tasks" && request.method === "GET") {
                const authHeader = request.headers.get("Authorization") || "";
                const token = authHeader.replace("Bearer ", "");
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret") as { userId: string } | null;
                if (!payload) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const result = await env.proveloce_db.prepare(`
                    SELECT t.id, t.title, t.description, t.deadline, t.status, t.priority, t.created_at,
                           u.name as customer_name
                    FROM tasks t
                    LEFT JOIN users u ON t.created_by_id = u.id
                    WHERE t.assigned_to_id = ?
                    ORDER BY t.created_at DESC
                `).bind(payload.userId).all();

                return jsonResponse({
                    success: true,
                    data: { tasks: result.results || [] }
                });
            }

            // GET /api/expert/earnings - Get expert's earnings history
            if (url.pathname === "/api/expert/earnings" && request.method === "GET") {
                const authHeader = request.headers.get("Authorization") || "";
                const token = authHeader.replace("Bearer ", "");
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret") as { userId: string } | null;
                if (!payload) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const result = await env.proveloce_db.prepare(`
                    SELECT e.id, e.amount, e.platform_fee, e.net_amount, e.payment_status, 
                           e.payout_reference, e.payout_date, e.created_at,
                           t.title as task_title
                    FROM expert_earnings e
                    LEFT JOIN tasks t ON e.task_id = t.id
                    WHERE e.expert_id = ?
                    ORDER BY e.created_at DESC
                `).bind(payload.userId).all();

                // Calculate totals
                const totals = await env.proveloce_db.prepare(`
                    SELECT 
                        COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN net_amount ELSE 0 END), 0) as total_paid,
                        COALESCE(SUM(CASE WHEN payment_status = 'pending' THEN net_amount ELSE 0 END), 0) as pending
                    FROM expert_earnings WHERE expert_id = ?
                `).bind(payload.userId).first() as any;

                return jsonResponse({
                    success: true,
                    data: {
                        earnings: result.results || [],
                        summary: {
                            totalPaid: totals?.total_paid || 0,
                            pending: totals?.pending || 0,
                        }
                    }
                });
            }

            // GET /api/expert/helpdesk - Get expert's support tickets
            if (url.pathname === "/api/expert/helpdesk" && request.method === "GET") {
                const authHeader = request.headers.get("Authorization") || "";
                const token = authHeader.replace("Bearer ", "");
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret") as { userId: string } | null;
                if (!payload) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const result = await env.proveloce_db.prepare(`
                    SELECT id, subject, description, status, category, priority, created_at, resolved_at
                    FROM tickets 
                    WHERE user_id = ?
                    ORDER BY created_at DESC
                `).bind(payload.userId).all();

                return jsonResponse({
                    success: true,
                    data: { tickets: result.results || [] }
                });
            }

            // GET /api/expert/notifications - Get expert's notifications
            if (url.pathname === "/api/expert/notifications" && request.method === "GET") {
                const authHeader = request.headers.get("Authorization") || "";
                const token = authHeader.replace("Bearer ", "");
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret") as { userId: string } | null;
                if (!payload) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const result = await env.proveloce_db.prepare(`
                    SELECT id, title, message, type, is_read, link, created_at
                    FROM notifications 
                    WHERE user_id = ?
                    ORDER BY created_at DESC
                    LIMIT 50
                `).bind(payload.userId).all();

                return jsonResponse({
                    success: true,
                    data: { notifications: result.results || [] }
                });
            }

            // =====================================================
            // HELPDESK APIs (Role-based ticket routing)
            // =====================================================

            // POST /api/helpdesk/tickets - Create a new helpdesk ticket (Enterprise v2.0)
            if (url.pathname === "/api/helpdesk/tickets" && request.method === "POST") {
                const authHeader = request.headers.get("Authorization") || "";
                const token = authHeader.replace("Bearer ", "");
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret") as { userId: string } | null;
                if (!payload) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                // Get sender info including phone
                const sender = await env.proveloce_db.prepare(
                    "SELECT id, role, name, email, phone FROM users WHERE id = ?"
                ).bind(payload.userId).first() as any;

                const senderRole = sender?.role?.toUpperCase() || 'CUSTOMER';

                try {
                    // Parse request - support both JSON and FormData
                    let category: string = '';
                    let subject: string = '';
                    let description: string = '';
                    let attachmentFile: File | null = null;

                    const contentType = request.headers.get('Content-Type') || '';
                    if (contentType.includes('multipart/form-data')) {
                        const formData = await request.formData();
                        category = formData.get('category') as string || '';
                        subject = formData.get('subject') as string || '';
                        description = formData.get('description') as string || '';
                        const file = formData.get('attachment');
                        if (file && file instanceof File && file.size > 0) {
                            attachmentFile = file;
                        }
                    } else {
                        const body = await request.json() as any;
                        category = body.category || '';
                        subject = body.subject || '';
                        description = body.description || '';
                    }

                    // Strict Validation - Mandatory fields (no priority)
                    const missingFields: string[] = [];
                    if (!subject?.trim()) missingFields.push('subject');
                    else if (subject.length > 150) {
                        return jsonResponse({ success: false, error: "VALIDATION_ERROR", message: "Subject must be 150 characters or less" }, 400);
                    }

                    if (!category?.trim()) missingFields.push('category');
                    else if (category.length > 100) {
                        return jsonResponse({ success: false, error: "VALIDATION_ERROR", message: "Category must be 100 characters or less" }, 400);
                    }

                    if (!description?.trim()) missingFields.push('description');
                    if (description?.length > 5000) {
                        return jsonResponse({ success: false, error: "VALIDATION_ERROR", message: "Description must be 5000 characters or less" }, 400);
                    }

                    if (missingFields.length > 0) {
                        return jsonResponse({
                            success: false,
                            error: "VALIDATION_ERROR",
                            message: `Missing required fields: ${missingFields.join(', ')}`,
                            fields: missingFields
                        }, 400);
                    }

                    // Generate unique ticket ID: PV-TK-YYYYMMDD-HHMM
                    const now = new Date();
                    const yyyymmdd = now.getUTCFullYear() +
                        String(now.getUTCMonth() + 1).padStart(2, '0') +
                        String(now.getUTCDate()).padStart(2, '0');
                    const hhmm = String(now.getUTCHours()).padStart(2, '0') +
                        String(now.getUTCMinutes()).padStart(2, '0');
                    const ticketId = `PV-TK-${yyyymmdd}-${hhmm}`;

                    // Handle file attachment to R2
                    let attachmentUrl: string | null = null;
                    if (attachmentFile && env.others) {
                        const fileId = crypto.randomUUID();
                        const fileExt = attachmentFile.name.split('.').pop() || 'bin';
                        const filePath = `helpdesk/${ticketId}/${fileId}.${fileExt}`;
                        await env.others.put(filePath, attachmentFile.stream(), {
                            httpMetadata: { contentType: attachmentFile.type || 'application/octet-stream' }
                        });
                        // Use internal API endpoint to serve attachments
                        attachmentUrl = `/api/helpdesk/attachments/${filePath}`;
                    }

                    // Insert into tickets table with full user profile
                    await env.proveloce_db.prepare(`
                        INSERT INTO tickets (
                            ticket_id, user_id, user_role, user_full_name, user_email, user_phone_number,
                            subject, category, description, attachment_url, status
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
                    `).bind(
                        ticketId,
                        payload.userId,
                        senderRole,
                        sender?.name || '',
                        sender?.email || '',
                        sender?.phone || null,
                        subject.trim(),
                        category.trim(),
                        description.trim(),
                        attachmentUrl
                    ).run();

                    return jsonResponse({
                        success: true,
                        message: `Your ticket ${ticketId} has been created successfully`,
                        data: {
                            ticketId: ticketId,
                            attachmentUrl: attachmentUrl
                        }
                    });
                } catch (error: any) {
                    console.error("Ticket creation error:", error);
                    return jsonResponse({ success: false, error: error.message || "SERVER_ERROR" }, 500);
                }
            }

            // GET /api/helpdesk/tickets - Unified Ticket Visibility (Enterprise v2.0)
            if (url.pathname === "/api/helpdesk/tickets" && request.method === "GET") {
                const authHeader = request.headers.get("Authorization") || "";
                const token = authHeader.replace("Bearer ", "");
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret") as { userId: string } | null;
                if (!payload) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const user = await env.proveloce_db.prepare(
                    "SELECT role FROM users WHERE id = ?"
                ).bind(payload.userId).first() as any;

                const role = user?.role?.toUpperCase() || 'CUSTOMER';

                // Visibility Logic per requirements:
                // Customers & Experts: Can only see their own tickets
                // Admins: Can see all customer & expert tickets
                // Superadmin: Can see all tickets (including admin-raised)
                let whereClause = '';
                let params: any[] = [];

                if (role === 'CUSTOMER') {
                    whereClause = 't.user_id = ?';
                    params = [payload.userId];
                } else if (role === 'EXPERT') {
                    // Experts see their own tickets OR tickets assigned to them
                    whereClause = '(t.user_id = ? OR t.ticket_assigned_user = ?)';
                    params = [payload.userId, payload.userId];
                } else if (role === 'ADMIN') {
                    // Admins see Customer/Expert tickets OR tickets they created herself
                    whereClause = '(t.user_role IN (?, ?) OR t.user_id = ?)';
                    params = ['CUSTOMER', 'EXPERT', payload.userId];
                } else if (role === 'SUPERADMIN') {
                    // No WHERE clause - see all tickets
                }

                const query = `
                    SELECT 
                        t.*,
                        u_resp.name as responder_name,
                        u_resp.role as responder_role,
                        u_assign.name as assigned_user_name,
                        u_assign.role as assigned_user_role
                    FROM tickets t
                    LEFT JOIN users u_resp ON t.ticket_responder = u_resp.id
                    LEFT JOIN users u_assign ON t.ticket_assigned_user = u_assign.id
                    ${whereClause ? 'WHERE ' + whereClause : ''}
                    ORDER BY t.created_at DESC
                `;

                const result = await env.proveloce_db.prepare(query).bind(...params).all();
                const tickets = result.results || [];

                return jsonResponse({
                    success: true,
                    data: { tickets }
                });
            }

            // GET /api/helpdesk/tickets/:ticket_id - Enterprise Retrieval (v2.0)
            if (url.pathname.match(/^\/api\/helpdesk\/tickets\/[^\/]+$/) && !url.pathname.includes('/status') && request.method === "GET") {
                const authHeader = request.headers.get("Authorization") || "";
                const token = authHeader.replace("Bearer ", "");
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret") as { userId: string } | null;
                if (!payload) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const ticketId = url.pathname.split('/')[4];

                // Get user role
                const user = await env.proveloce_db.prepare(
                    "SELECT role FROM users WHERE id = ?"
                ).bind(payload.userId).first() as any;
                const role = user?.role?.toUpperCase() || 'CUSTOMER';

                // Fetch and verify visibility
                const ticket = await env.proveloce_db.prepare(`
                    SELECT 
                        t.*,
                        u_resp.name as responder_name,
                        u_resp.role as responder_role,
                        u_assign.name as assigned_user_name,
                        u_assign.role as assigned_user_role
                    FROM tickets t
                    LEFT JOIN users u_resp ON t.ticket_responder = u_resp.id
                    LEFT JOIN users u_assign ON t.ticket_assigned_user = u_assign.id
                    WHERE t.ticket_id = ?
                `).bind(ticketId).first() as any;

                if (!ticket) {
                    return jsonResponse({ success: false, error: "Ticket not found" }, 404);
                }

                // Check visibility permissions
                let canView = false;
                if (role === 'CUSTOMER') {
                    canView = ticket.user_id === payload.userId;
                } else if (role === 'EXPERT') {
                    // Expert can view if they created it OR it's assigned to them
                    canView = ticket.user_id === payload.userId || ticket.ticket_assigned_user === payload.userId;
                } else if (role === 'ADMIN') {
                    // Admins see Customer/Expert tickets OR tickets they created
                    canView = ticket.user_role === 'CUSTOMER' || ticket.user_role === 'EXPERT' || ticket.user_id === payload.userId;
                } else if (role === 'SUPERADMIN') {
                    canView = true;
                }

                if (!canView) {
                    return jsonResponse({ success: false, error: "Not authorized to view this ticket" }, 403);
                }

                return jsonResponse({
                    success: true,
                    data: { ticket }
                });
            }

            // PATCH /api/helpdesk/tickets/:ticket_id/status - Update ticket status and reply (Enterprise v2.0)
            if (url.pathname.match(/^\/api\/helpdesk\/tickets\/[^\/]+\/status$/) && request.method === "PATCH") {
                const authHeader = request.headers.get("Authorization") || "";
                const token = authHeader.replace("Bearer ", "");
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret") as { userId: string } | null;
                if (!payload) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const ticketId = url.pathname.split('/')[4];
                const body = await request.json() as any;
                const { status, reply } = body;

                // Valid statuses: PENDING, APPROVED, REJECTED
                const validStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
                if (!status || !validStatuses.includes(status)) {
                    return jsonResponse({
                        success: false,
                        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
                    }, 400);
                }

                // Get user role
                const user = await env.proveloce_db.prepare(
                    "SELECT role FROM users WHERE id = ?"
                ).bind(payload.userId).first() as any;

                const role = user?.role?.toUpperCase() || '';

                // Get ticket by ticket_id
                const ticket = await env.proveloce_db.prepare(
                    "SELECT * FROM tickets WHERE ticket_id = ?"
                ).bind(ticketId).first() as any;

                if (!ticket) {
                    return jsonResponse({ success: false, error: "Ticket not found" }, 404);
                }

                // Permission check
                let canUpdate = false;
                if (role === 'EXPERT') {
                    // Expert can update ONLY if ticket is assigned to them
                    canUpdate = ticket.ticket_assigned_user === payload.userId;
                } else if (role === 'ADMIN') {
                    // Admin can update any Customer or Expert ticket
                    canUpdate = ticket.user_role === 'CUSTOMER' || ticket.user_role === 'EXPERT';
                } else if (role === 'SUPERADMIN') {
                    // SuperAdmin can update all
                    canUpdate = true;
                }

                if (!canUpdate) {
                    return jsonResponse({ success: false, error: "Not authorized to update this ticket" }, 403);
                }

                // Update ticket status, message_response and set responder
                await env.proveloce_db.prepare(`
                    UPDATE tickets SET 
                        status = ?, 
                        message_response = ?, 
                        ticket_responder = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE ticket_id = ?
                `).bind(status, reply || null, payload.userId, ticketId).run();

                return jsonResponse({
                    success: true,
                    message: "Ticket status updated successfully",
                    data: { ticketId, status, messageResponse: reply }
                });
            }

            // PATCH /api/helpdesk/tickets/:ticket_id/assign - Assign ticket to user (Enterprise v2.1)
            if (url.pathname.match(/^\/api\/helpdesk\/tickets\/[^\/]+\/assign$/) && request.method === "PATCH") {
                const authHeader = request.headers.get("Authorization") || "";
                const token = authHeader.replace("Bearer ", "");
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret") as { userId: string } | null;
                if (!payload) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const ticketId = url.pathname.split('/')[4];
                const { assignedToId } = await request.json() as { assignedToId: string };

                if (!assignedToId) {
                    return jsonResponse({ success: false, error: "assignedToId is required" }, 400);
                }

                // Verify requester is Admin or SuperAdmin
                const requester = await env.proveloce_db.prepare(
                    "SELECT role FROM users WHERE id = ?"
                ).bind(payload.userId).first() as any;
                const requesterRole = requester?.role?.toUpperCase() || '';

                if (requesterRole !== 'ADMIN' && requesterRole !== 'SUPERADMIN') {
                    return jsonResponse({ success: false, error: "Only Admin or SuperAdmin can assign tickets" }, 403);
                }

                // Verify assigned user exists and is at least an Expert or Admin
                const assignedUser = await env.proveloce_db.prepare(
                    "SELECT role FROM users WHERE id = ?"
                ).bind(assignedToId).first() as any;

                if (!assignedUser) {
                    return jsonResponse({ success: false, error: "Assigned user not found" }, 404);
                }

                const assignedRole = assignedUser.role?.toUpperCase() || '';
                if (!['EXPERT', 'ADMIN', 'SUPERADMIN', 'CUSTOMER'].includes(assignedRole)) {
                    // Although typically Experts/Admins, being flexible for now or specific roles
                    return jsonResponse({ success: false, error: "Tickets can only be assigned to EXPERT, ADMIN or CUSTOMER (if applicable)" }, 400);
                }

                // Update ticket
                await env.proveloce_db.prepare(`
                    UPDATE tickets SET 
                        ticket_assigned_user = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE ticket_id = ?
                `).bind(assignedToId, ticketId).run();

                return jsonResponse({
                    success: true,
                    message: "Ticket assigned successfully"
                });
            }

            // GET /api/helpdesk/attachments/* - Serve attachments from R2 (POML compliant)
            if (url.pathname.startsWith("/api/helpdesk/attachments/") && request.method === "GET") {
                const authHeader = request.headers.get("Authorization") || "";
                const token = authHeader.replace("Bearer ", "");
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret") as { userId: string } | null;
                if (!payload) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                // Extract the file path from URL
                const filePath = url.pathname.replace("/api/helpdesk/attachments/", "");

                if (!filePath || !env.others) {
                    return jsonResponse({ success: false, error: "Attachment not found" }, 404);
                }

                try {
                    const object = await env.others.get(filePath);
                    if (!object) {
                        return jsonResponse({ success: false, error: "Attachment not found in storage" }, 404);
                    }

                    const headers = new Headers();
                    headers.set("Content-Type", object.httpMetadata?.contentType || "application/octet-stream");
                    headers.set("Cache-Control", "private, max-age=3600");
                    // CORS headers for frontend access
                    headers.set("Access-Control-Allow-Origin", "*");
                    headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");

                    return new Response(object.body, { headers });
                } catch (err: any) {
                    console.error("Attachment fetch error:", err);
                    return jsonResponse({ success: false, error: "Failed to retrieve attachment" }, 500);
                }
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
