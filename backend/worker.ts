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

async function createNotification(env: any, userId: string, type: string, title: string, message: string, link?: string): Promise<void> {
    if (!env.proveloce_db) return;
    try {
        await env.proveloce_db.prepare(`
            INSERT INTO notifications (id, user_id, type, title, message, link, created_at)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).bind(crypto.randomUUID(), userId, type, title, message, link || null).run();
    } catch (error) {
        console.error("Failed to create notification:", error);
    }
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
// POML v1.0 Refresh Token Management
// =====================================================

async function storeRefreshToken(env: any, userId: string, token: string, expiresAt: Date): Promise<void> {
    if (!env.proveloce_db) return;
    try {
        await env.proveloce_db.prepare(`
            INSERT INTO refresh_tokens (id, user_id, token, expires_at, created_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).bind(crypto.randomUUID(), userId, token, expiresAt.toISOString()).run();

        // Audit log: refresh_token_stored
        await env.proveloce_db.prepare(`
            INSERT INTO activity_logs (id, user_id, action, details, created_at)
            VALUES (?, ?, 'refresh_token_stored', ?, CURRENT_TIMESTAMP)
        `).bind(crypto.randomUUID(), userId, JSON.stringify({ expires_at: expiresAt.toISOString() })).run();
    } catch (error) {
        console.error("Failed to store refresh token:", error);
    }
}

async function validateRefreshToken(env: any, token: string): Promise<{ valid: boolean; userId?: string; error?: string }> {
    if (!env.proveloce_db) return { valid: false, error: "Database not configured" };
    try {
        const result = await env.proveloce_db.prepare(`
            SELECT user_id, expires_at, revoked_at
            FROM refresh_tokens
            WHERE token = ?
        `).bind(token).first() as any;

        if (!result) return { valid: false, error: "Token not found" };
        if (result.revoked_at) return { valid: false, error: "Token has been revoked" };
        if (new Date(result.expires_at) < new Date()) return { valid: false, error: "Token has expired" };

        // Audit log: refresh_token_fetched
        await env.proveloce_db.prepare(`
            INSERT INTO activity_logs (id, user_id, action, details, created_at)
            VALUES (?, ?, 'refresh_token_fetched', ?, CURRENT_TIMESTAMP)
        `).bind(crypto.randomUUID(), result.user_id, JSON.stringify({ expires_at: result.expires_at })).run();

        return { valid: true, userId: result.user_id };
    } catch (error) {
        console.error("Failed to validate refresh token:", error);
        return { valid: false, error: "Validation failed" };
    }
}

async function revokeRefreshToken(env: any, token: string, userId?: string): Promise<boolean> {
    if (!env.proveloce_db) return false;
    try {
        await env.proveloce_db.prepare(`
            UPDATE refresh_tokens
            SET revoked_at = CURRENT_TIMESTAMP
            WHERE token = ?
        `).bind(token).run();

        // Audit log: refresh_token_revoked
        if (userId) {
            await env.proveloce_db.prepare(`
                INSERT INTO activity_logs (id, user_id, action, details, created_at)
                VALUES (?, ?, 'refresh_token_revoked', ?, CURRENT_TIMESTAMP)
            `).bind(crypto.randomUUID(), userId, JSON.stringify({ revoked_at: new Date().toISOString() })).run();
        }

        return true;
    } catch (error) {
        console.error("Failed to revoke refresh token:", error);
        return false;
    }
}

async function revokeAllUserTokens(env: any, userId: string): Promise<boolean> {
    if (!env.proveloce_db) return false;
    try {
        await env.proveloce_db.prepare(`
            UPDATE refresh_tokens
            SET revoked_at = CURRENT_TIMESTAMP
            WHERE user_id = ? AND revoked_at IS NULL
        `).bind(userId).run();
        return true;
    } catch (error) {
        console.error("Failed to revoke all user tokens:", error);
        return false;
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
                        "SELECT id, name, email, role, org_id, suspended, password_hash, status FROM users WHERE email = ?"
                    ).bind(body.email).first() as any;

                    if (!user) {
                        return jsonResponse({ success: false, error: "Invalid email or password" }, 401);
                    }

                    // TODO: Verify password hash (implement proper password verification)
                    // For now, just generate JWT for existing user

                    // login trigger: set status to 'Active' if NULL or 'pending_verification'
                    const currentStatus = user.status;
                    if (!currentStatus || currentStatus === 'pending_verification') {
                        await env.proveloce_db.prepare(
                            "UPDATE users SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
                        ).bind(user.id).run();

                        // Log the activation
                        await env.proveloce_db.prepare(
                            "INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?, ?)"
                        ).bind(crypto.randomUUID(), user.id, "USER_ACTIVATION", "user", user.id, JSON.stringify({ reason: "Login Trigger", oldStatus: currentStatus, newStatus: "active" })).run();
                    }

                    const token = await createJWT(
                        { userId: user.id, email: user.email, name: user.name, role: user.role, org_id: user.org_id || 'ORG-DEFAULT' },
                        env.JWT_ACCESS_SECRET || "default-secret"
                    );

                    return jsonResponse({
                        success: true,
                        message: "Login successful",
                        token,
                        user: { id: user.id, name: user.name, email: user.email, role: user.role, status: 'active' }
                    });
                } catch (e: any) {
                    return jsonResponse({ success: false, error: e.message || "Login failed" }, 400);
                }
            }

            // =====================================================
            // Email/Password Signup (POML v1.0)
            // =====================================================

            if (url.pathname === "/api/auth/signup" && request.method === "POST") {
                try {
                    const body = await request.json() as {
                        email?: string;
                        password?: string;
                        name?: string;
                        profile_photo_url?: string;
                        bio?: string;
                        dob?: string;
                        phone?: string;
                    };

                    if (!body.email || !body.password || !body.name) {
                        return jsonResponse({ success: false, error: "Email, password, and name are required" }, 400);
                    }

                    if (!env.proveloce_db) {
                        return jsonResponse({ success: false, error: "Database not configured" }, 500);
                    }

                    // Check if user already exists
                    const existingUser = await env.proveloce_db.prepare(
                        "SELECT id FROM users WHERE email = ?"
                    ).bind(body.email).first();

                    if (existingUser) {
                        return jsonResponse({ success: false, error: "User already exists with this email" }, 409);
                    }

                    // Hash password
                    const encoder = new TextEncoder();
                    const data = encoder.encode(body.password);
                    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
                    const hashArray = Array.from(new Uint8Array(hashBuffer));
                    const passwordHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

                    const userId = crypto.randomUUID();
                    const role = "customer"; // Default role as per POML
                    const status = "active";

                    await env.proveloce_db.prepare(
                        "INSERT INTO users (id, name, email, password_hash, role, status, profile_photo_url, bio, dob, phone, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)"
                    ).bind(
                        userId,
                        body.name,
                        body.email,
                        passwordHash,
                        role,
                        status,
                        body.profile_photo_url || null,
                        body.bio || null,
                        body.dob || null,
                        body.phone || null
                    ).run();

                    // Log activity
                    await env.proveloce_db.prepare(
                        "INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?, ?)"
                    ).bind(crypto.randomUUID(), userId, "USER_REGISTRATION", "user", userId, JSON.stringify({ method: "email", role, status })).run();

                    const token = await createJWT(
                        { userId: userId, email: body.email, name: body.name, role: role, org_id: 'ORG-DEFAULT' },
                        env.JWT_ACCESS_SECRET || "default-secret"
                    );

                    return jsonResponse({
                        success: true,
                        message: "Signup successful",
                        token,
                        user: { id: userId, name: body.name, email: body.email, role: role, status: status }
                    }, 201);

                } catch (e: any) {
                    console.error("Signup error:", e);
                    return jsonResponse({ success: false, error: e.message || "Signup failed" }, 400);
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
            // POST /api/auth/refresh - POML v1.0 Refresh Token
            // =====================================================

            if (url.pathname === "/api/auth/refresh" && request.method === "POST") {
                try {
                    const body = await request.json() as { refreshToken?: string };

                    if (!body.refreshToken) {
                        return jsonResponse({ success: false, error: "Refresh token is required" }, 400);
                    }

                    if (!env.proveloce_db) {
                        return jsonResponse({ success: false, error: "Database not configured" }, 500);
                    }

                    // Validate the refresh token
                    const validation = await validateRefreshToken(env, body.refreshToken);

                    if (!validation.valid) {
                        return jsonResponse({ success: false, error: validation.error || "Invalid refresh token" }, 401);
                    }

                    // Get user info for new access token
                    const user = await env.proveloce_db.prepare(
                        "SELECT id, name, email, role, org_id FROM users WHERE id = ?"
                    ).bind(validation.userId).first() as any;

                    if (!user) {
                        return jsonResponse({ success: false, error: "User not found" }, 404);
                    }

                    // Revoke old refresh token (rotation)
                    await revokeRefreshToken(env, body.refreshToken, validation.userId);

                    // Create new access token
                    const newAccessToken = await createJWT(
                        { userId: user.id, email: user.email, name: user.name, role: user.role, org_id: user.org_id || 'ORG-DEFAULT' },
                        env.JWT_ACCESS_SECRET || "default-secret"
                    );

                    // Create new refresh token (24h rotation per POML spec)
                    const newRefreshToken = crypto.randomUUID();
                    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
                    await storeRefreshToken(env, user.id, newRefreshToken, expiresAt);

                    return jsonResponse({
                        success: true,
                        accessToken: newAccessToken,
                        refreshToken: newRefreshToken,
                        expiresIn: 604800 // 7 days for access token
                    });
                } catch (e: any) {
                    console.error("Refresh token error:", e);
                    return jsonResponse({ success: false, error: "Token refresh failed" }, 500);
                }
            }

            // =====================================================
            // POST /api/auth/logout - POML v1.0 Token Revocation
            // =====================================================

            if (url.pathname === "/api/auth/logout" && request.method === "POST") {
                try {
                    const authHeader = request.headers.get("Authorization");
                    let userId: string | undefined;

                    // Try to get userId from access token if provided
                    if (authHeader && authHeader.startsWith("Bearer ")) {
                        const token = authHeader.substring(7);
                        const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret");
                        if (payload) {
                            userId = payload.userId;
                        }
                    }

                    const body = await request.json() as { refreshToken?: string; revokeAll?: boolean };

                    if (!env.proveloce_db) {
                        return jsonResponse({ success: false, error: "Database not configured" }, 500);
                    }

                    if (body.revokeAll && userId) {
                        // Revoke ALL user tokens
                        await revokeAllUserTokens(env, userId);
                        return jsonResponse({ success: true, message: "All tokens revoked" });
                    }

                    if (body.refreshToken) {
                        // Revoke specific refresh token
                        await revokeRefreshToken(env, body.refreshToken, userId);
                        return jsonResponse({ success: true, message: "Token revoked" });
                    }

                    return jsonResponse({ success: true, message: "Logout successful" });
                } catch (e: any) {
                    console.error("Logout error:", e);
                    return jsonResponse({ success: false, error: "Logout failed" }, 500);
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
                        "SELECT id, name, email, role, org_id, suspended FROM users WHERE email = ?"
                    ).bind(googleUser.email).first();

                    // Create user if doesn't exist
                    if (!user) {
                        const userId = crypto.randomUUID();
                        await env.proveloce_db.prepare(
                            "INSERT INTO users (id, name, email, role, status, email_verified, avatar_data) VALUES (?, ?, ?, ?, ?, ?, ?)"
                        ).bind(
                            userId,
                            googleUser.name,
                            googleUser.email,
                            "customer",
                            "active",
                            1,
                            googleUser.picture || null
                        ).run();

                        // Log activity
                        await env.proveloce_db.prepare(
                            "INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?, ?)"
                        ).bind(crypto.randomUUID(), userId, "USER_REGISTRATION", "user", userId, JSON.stringify({ method: "google", role: "customer", status: "active" })).run();

                        user = {
                            id: userId,
                            name: googleUser.name,
                            email: googleUser.email,
                            role: "customer",
                            status: "active"
                        };
                    } else {
                        // existing user login trigger
                        if (!user.status || user.status === 'pending_verification') {
                            await env.proveloce_db.prepare(
                                "UPDATE users SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
                            ).bind(user.id).run();

                            await env.proveloce_db.prepare(
                                "INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?, ?)"
                            ).bind(crypto.randomUUID(), user.id, "USER_ACTIVATION", "user", user.id, JSON.stringify({ method: "google", oldStatus: user.status, newStatus: "active" })).run();

                            user.status = "active";
                        }
                    }

                    // Generate JWT token
                    const jwtToken = await createJWT(
                        {
                            userId: user.id,
                            email: user.email,
                            name: user.name,
                            role: user.role,
                            org_id: user.org_id || 'ORG-DEFAULT'
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
                    "SELECT id, name, email, phone, role, profile_photo_url, profile_image, avatar_data, created_at FROM users WHERE id = ?"
                ).bind(payload.userId).first() as any;

                const profile = await env.proveloce_db.prepare(
                    "SELECT * FROM user_profiles WHERE user_id = ?"
                ).bind(payload.userId).first() as any;

                // Return user data with phone and avatarUrl explicitly at top level
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
                            profile: {
                                ...profile,
                                avatarUrl: user?.profile_image || user?.profile_photo_url || user?.avatar_data || null
                            }
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

            // POST /api/profiles/me/avatar - Upload profile avatar to R2
            if (url.pathname === "/api/profiles/me/avatar" && request.method === "POST") {
                const authHeader = request.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const token = authHeader.substring(7);
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret");

                if (!payload) {
                    return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
                }

                if (!env.proveloce_db || !env.others) {
                    return jsonResponse({ success: false, error: "Storage not configured" }, 500);
                }

                try {
                    // Parse multipart form data
                    const contentType = request.headers.get("Content-Type") || "";
                    if (!contentType.includes("multipart/form-data")) {
                        return jsonResponse({ success: false, error: "Content-Type must be multipart/form-data" }, 400);
                    }

                    const formData = await request.formData();
                    const file = formData.get("avatar") as File | null;

                    if (!file) {
                        return jsonResponse({ success: false, error: "No avatar file provided" }, 400);
                    }

                    // Validate file size (max 5MB)
                    if (file.size > 5 * 1024 * 1024) {
                        return jsonResponse({ success: false, error: "File size must be less than 5MB" }, 400);
                    }

                    // Validate file type
                    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
                    if (!allowedTypes.includes(file.type)) {
                        return jsonResponse({ success: false, error: "Only JPEG, PNG, GIF, and WebP images are allowed" }, 400);
                    }

                    // Generate unique filename
                    const ext = file.name.split(".").pop() || "jpg";
                    const timestamp = Date.now();
                    const r2Key = `profile-photos/${payload.userId}-${timestamp}.${ext}`;

                    // Upload to R2 'others' bucket
                    const fileBuffer = await file.arrayBuffer();
                    await env.others.put(r2Key, fileBuffer, {
                        httpMetadata: {
                            contentType: file.type,
                        },
                    });

                    // Construct public URL
                    const avatarUrl = `https://pub-others.r2.dev/${r2Key}`;

                    // Update user's profile_image and profile_photo_url in database
                    // Append timestamp for cache busting if needed, but unique filename per upload is better
                    await env.proveloce_db.prepare(
                        "UPDATE users SET profile_image = ?, profile_photo_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
                    ).bind(avatarUrl, avatarUrl, payload.userId).run();

                    // Also update user_profiles.avatar_url if the table has that column
                    try {
                        await env.proveloce_db.prepare(
                            "UPDATE user_profiles SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?"
                        ).bind(avatarUrl, payload.userId).run();
                    } catch (e) {
                        // Ignore if avatar_url column doesn't exist in user_profiles
                    }

                    console.log(`✅ Avatar uploaded for user ${payload.userId}: ${r2Key}`);

                    return jsonResponse({
                        success: true,
                        message: "Avatar uploaded successfully",
                        data: { avatarUrl }
                    });
                } catch (error: any) {
                    console.error("Avatar upload error:", error);
                    return jsonResponse({ success: false, error: "Failed to upload avatar" }, 500);
                }
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

                let query = "SELECT id, name, email, phone, role, status, profile_image, profile_photo_url, email_verified, last_login_at, created_at FROM users WHERE 1=1";
                const params: any[] = [];

                // Role-based visibility restrictions
                const requesterRole = (auth.payload.role || "").toLowerCase();
                if (requesterRole === "superadmin") {
                    // SuperAdmin cannot see other SuperAdmins (including themselves)
                    query += " AND role != 'superadmin'";
                } else if (requesterRole === "admin") {
                    // Admin can only see Customer, Expert, Analyst, Agent, Viewer
                    query += " AND role IN ('customer', 'expert', 'analyst', 'agent', 'viewer')";
                }

                if (filterRole) {
                    query += " AND LOWER(role) = LOWER(?)";
                    params.push(filterRole);
                }
                if (status) {
                    query += " AND LOWER(status) = LOWER(?)";
                    params.push(status);
                }
                if (search) {
                    query += " AND (name LIKE ? OR email LIKE ?)";
                    params.push(`%${search}%`, `%${search}%`);
                }

                // Get total count
                const countQuery = query.replace("SELECT id, name, email, phone, role, status, profile_image, profile_photo_url, email_verified, last_login_at, created_at", "SELECT COUNT(*) as total");
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

            // GET /api/users - General user listing (Enterprise v2.2)
            if (url.pathname === "/api/users" && request.method === "GET") {
                const authHeader = request.headers.get("Authorization") || "";
                const token = authHeader.replace("Bearer ", "");
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret") as { userId: string; role?: string; org_id?: string } | null;

                if (!payload) return jsonResponse({ success: false, error: "Unauthorized" }, 401);

                const role = (payload.role || "").toUpperCase();
                const requesterOrgId = payload.org_id || 'ORG-DEFAULT';

                let query = "SELECT id, name, email, phone, role, status, org_id FROM users WHERE status = 'active'";
                const params: any[] = [];

                // Filter by roles if provided
                const rolesParam = url.searchParams.get('roles');
                if (rolesParam) {
                    const requestedRoles = rolesParam.split(',').map(r => r.trim().toUpperCase()).filter(r => r !== "");
                    if (requestedRoles.length > 0) {
                        const placeholders = requestedRoles.map(() => '?').join(',');
                        query += ` AND UPPER(role) IN (${placeholders})`;
                        params.push(...requestedRoles);
                    }
                }

                if (role === 'SUPERADMIN') {
                    // SuperAdmin can see everyone active
                } else if (role === 'ADMIN') {
                    // Admins see people in their org
                    query += " AND org_id = ?";
                    params.push(requesterOrgId);
                } else {
                    return jsonResponse({ success: false, error: "Access denied" }, 403);
                }

                const result = await env.proveloce_db.prepare(query).bind(...params).all();

                return jsonResponse({
                    success: true,
                    data: {
                        data: result.results
                    }
                });
            }

            // GET /api/admin/users/:id - Get single user with full details and history
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
                    "SELECT id, name, email, phone, role, status, profile_image, profile_photo_url, email_verified, last_login_at, created_at, updated_at FROM users WHERE id = ?"
                ).bind(id).first() as any;

                if (!user) {
                    return jsonResponse({ success: false, error: "User not found" }, 404);
                }

                // Get user profile
                const profile = await env.proveloce_db.prepare(
                    "SELECT * FROM user_profiles WHERE user_id = ?"
                ).bind(id).first();

                // Get connect requests (bookings) history
                let bookings: any[] = [];
                try {
                    const bookingsResult = await env.proveloce_db.prepare(`
                        SELECT cr.*,
                               e.name as expert_name,
                               c.name as customer_name
                        FROM connect_requests cr
                        LEFT JOIN users e ON e.id = cr.expert_id
                        LEFT JOIN users c ON c.id = cr.customer_id
                        WHERE cr.customer_id = ? OR cr.expert_id = ?
                        ORDER BY cr.created_at DESC
                        LIMIT 50
                    `).bind(id, id).all();
                    bookings = bookingsResult.results || [];
                } catch (e) {
                    console.error("Error fetching bookings:", e);
                }

                // Get session history (meetings)
                let sessions: any[] = [];
                try {
                    const sessionsResult = await env.proveloce_db.prepare(`
                        SELECT s.*,
                               e.name as expert_name,
                               c.name as customer_name
                        FROM sessions s
                        LEFT JOIN users e ON e.id = s.expert_id
                        LEFT JOIN users c ON c.id = s.customer_id
                        WHERE s.customer_id = ? OR s.expert_id = ?
                        ORDER BY s.scheduled_date DESC
                        LIMIT 50
                    `).bind(id, id).all();
                    sessions = sessionsResult.results || [];
                } catch (e) {
                    console.error("Error fetching sessions:", e);
                }

                // Get expert application if user is an expert or has applied
                let expertApplication = null;
                try {
                    const appResult = await env.proveloce_db.prepare(
                        "SELECT * FROM expert_applications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1"
                    ).bind(id).first();
                    expertApplication = appResult;
                } catch (e) {
                    console.error("Error fetching expert application:", e);
                }

                // Get activity logs for this user
                let activityLogs: any[] = [];
                try {
                    const logsResult = await env.proveloce_db.prepare(`
                        SELECT * FROM activity_logs 
                        WHERE user_id = ? OR entity_id = ?
                        ORDER BY created_at DESC
                        LIMIT 20
                    `).bind(id, id).all();
                    activityLogs = logsResult.results || [];
                } catch (e) {
                    console.error("Error fetching activity logs:", e);
                }

                return jsonResponse({ 
                    success: true, 
                    data: { 
                        user: { ...user, profile },
                        profile,
                        bookings,
                        sessions,
                        expertApplication,
                        activityLogs
                    } 
                });
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
                const finalRole = (role || "Customer").toLowerCase() === "expert" ? "Expert" : (role === "Customer" || role === "viewer" ? "Customer" : role);
                const finalStatus = (status || "active").toLowerCase();

                // Validation
                if (!['superadmin', 'admin', 'Expert', 'Customer'].includes(finalRole)) {
                    return jsonResponse({ success: false, error: "Invalid role (must be Expert or Customer)" }, 400);
                }
                if (!['active', 'inactive', 'suspended'].includes(finalStatus)) {
                    return jsonResponse({ success: false, error: "Invalid status" }, 400);
                }

                // Only superadmin can create superadmin or admin users
                if ((finalRole === "superadmin" || finalRole === "admin") && requesterRole !== "superadmin") {
                    return jsonResponse({ success: false, error: "Only superadmin can create privileged users" }, 403);
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
                ).bind(id, name, email, phone || null, finalRole, finalStatus, passwordHash).run();

                // Log activity
                await env.proveloce_db.prepare(
                    "INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?, ?)"
                ).bind(crypto.randomUUID(), auth.payload.userId, "CREATE_USER", "user", id, JSON.stringify({ name, email, role: finalRole })).run();

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
                const { name, email, phone, role, status, save_cta_state, save_cta_action } = body;

                // Workflow_SaveCTA Enforcement
                if (save_cta_state !== 'enabled' || save_cta_action !== 'commit_changes_to_db') {
                    return jsonResponse({ success: false, error: "Workflow compliance error: Save CTA state must be enabled and action must be commit_changes_to_db" }, 400);
                }

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

                // role change guards (RoleMapping spec)
                if (role !== undefined) {
                    if (!['superadmin', 'admin', 'Expert', 'Customer'].includes(role)) {
                        return jsonResponse({ success: false, error: "Invalid role mapping: value must be Expert or Customer" }, 400);
                    }

                    // Enforce RBAC guardrails: Only superadmin can change roles
                    if (requesterRole !== "superadmin") {
                        return jsonResponse({ success: false, error: "Only superadmin can change roles" }, 403);
                    }

                    // Prevent self-demotion
                    if (existing.id === auth.payload.userId) {
                        return jsonResponse({ success: false, error: "Superadmin cannot demote self" }, 403);
                    }
                }

                if (status !== undefined) {
                    const nextStatus = status.toLowerCase();
                    if (!['active', 'inactive', 'suspended'].includes(nextStatus)) {
                        return jsonResponse({ success: false, error: "Invalid status" }, 400);
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

                // Log activity with save_cta metadata
                await env.proveloce_db.prepare(
                    "INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?, ?)"
                ).bind(
                    crypto.randomUUID(),
                    auth.payload.userId,
                    "UPDATE_USER",
                    "user",
                    id,
                    JSON.stringify({
                        ...body,
                        save_cta_invoked: {
                            state: save_cta_state,
                            action: save_cta_action,
                            timestamp: new Date().toISOString()
                        }
                    })
                ).run();

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

                // Update status to 'inactive' (POML Spec)
                await env.proveloce_db.prepare(
                    "UPDATE users SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
                ).bind(id).run();

                // Log activity
                await env.proveloce_db.prepare(
                    "INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?, ?)"
                ).bind(crypto.randomUUID(), auth.payload.userId, "DEACTIVATE_USER", "user", id, JSON.stringify({ oldRole: existing.role, newStatus: 'inactive' })).run();

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
                    agents: 0, // Added agent count
                    viewers: 0, // Added viewer count
                    activeUsers: 0,
                    pendingUsers: 0,
                    recentUsers: [] as any[]
                };

                // Get counts by role (FILTERED BY ACTIVE STATUS per Spec)
                const roleCounts = await env.proveloce_db.prepare(
                    "SELECT role, COUNT(*) as count FROM users WHERE status = 'active' GROUP BY role"
                ).all();

                // Get Total Users count separately (all statuses)
                const totalCount = await env.proveloce_db.prepare(
                    "SELECT COUNT(*) as count FROM users"
                ).first() as any;
                stats.totalUsers = totalCount?.count || 0;

                for (const row of roleCounts.results as any[]) {
                    const role = (row.role || "").toLowerCase();
                    const count = row.count || 0;
                    if (role === "admin") stats.admins = count;
                    if (role === "superadmin") stats.admins += count; // Include superadmins in admin count
                    if (role === "expert") stats.experts = count;
                    if (role === "customer") stats.customers = count;
                    if (role === "analyst") stats.analysts = count;
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
                const validStatuses = ["PENDING", "APPROVED", "REJECTED", "DRAFT", "UNDER_REVIEW", "REQUIRES_CLARIFICATION", "REVOKED", ""];
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
                    const requesterOrgId = payload.org_id || 'ORG-DEFAULT';
                    const isAdmin = role === 'admin';

                    let whereClauses = [];

                    if (isAdmin) {
                        whereClauses.push("ea.org_id = ?");
                        params.push(requesterOrgId);
                    }

                    if (statusFilter && statusFilter !== "") {
                        whereClauses.push("LOWER(ea.status) = LOWER(?)");
                        params.push(statusFilter);
                    }

                    if (whereClauses.length > 0) {
                        query += ` WHERE ${whereClauses.join(" AND ")}`;
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

                        let docMetadata = [];
                        let imgMetadata = [];
                        try { docMetadata = row.documents ? JSON.parse(row.documents) : []; } catch { }
                        try { imgMetadata = row.images ? JSON.parse(row.images) : []; } catch { }

                        return {
                            id: row.id,
                            userId: row.userId,
                            orgId: row.org_id,
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

                    // Tenant Isolation Check (Spec v2.0)
                    const requesterOrgId = payload.org_id || 'ORG-DEFAULT';
                    if (role === 'admin' && app.org_id !== requesterOrgId) {
                        return jsonResponse({ success: false, error: "Access denied. Tenant mismatch." }, 403);
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

                // Update application status to 'Approved'
                await env.proveloce_db.prepare(
                    "UPDATE expert_applications SET status = 'approved', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
                ).bind(payload.userId, applicationId).run();

                // Update user role to 'agent'
                await env.proveloce_db.prepare(
                    "UPDATE users SET role = 'agent', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
                ).bind(app.user_id).run();

                // Log activity
                await env.proveloce_db.prepare(
                    "INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?, ?)"
                ).bind(crypto.randomUUID(), payload.userId, "APPROVE_EXPERT_APPLICATION", "expert_application", applicationId, JSON.stringify({ approvedBy: payload.userId, userId: app.user_id, status: 'approved', role: 'agent' })).run();

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
                    "UPDATE expert_applications SET status = 'Rejected', rejection_reason = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
                ).bind(reason, payload.userId, applicationId).run();

                // Log activity
                await env.proveloce_db.prepare(
                    "INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?, ?)"
                ).bind(crypto.randomUUID(), payload.userId, "REJECT_EXPERT_APPLICATION", "expert_application", applicationId, JSON.stringify({ rejectedBy: payload.userId, status: 'Rejected', reason })).run();

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
                        const userOrgId = payload.org_id || 'ORG-DEFAULT';
                        await env.proveloce_db.prepare(`
                            INSERT INTO expert_applications (id, user_id, org_id, status, created_at, updated_at)
                            VALUES (?, ?, ?, 'draft', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                        `).bind(newId, payload.userId, userOrgId).run();

                        application = {
                            id: newId,
                            user_id: payload.userId,
                            org_id: userOrgId,
                            status: 'draft',
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        };
                        console.log(`✅ Auto-created DRAFT application for user ${payload.userId}`);
                    }

                    return jsonResponse({
                        success: true,
                        data: {
                            application: {
                                ...application,
                                profile_phone: application.profile_phone || "",
                                profile_dob: application.profile_dob || "",
                                profile_address: application.profile_address || ""
                            }
                        }
                    });
                } catch (error: any) {
                    console.error("Error fetching/creating application:", error);
                    return jsonResponse({ success: false, error: "Failed to fetch application" }, 500);
                }
            }

            // POST /api/expert-application - Save/update draft (POML v1.0)
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

                    // Check if application exists
                    const existing = await env.proveloce_db.prepare(
                        "SELECT id, status FROM expert_applications WHERE user_id = ?"
                    ).bind(payload.userId).first() as any;

                    if (existing) {
                        const currentStatus = (existing.status || '').toLowerCase();
                        if (currentStatus === 'pending') {
                            return jsonResponse({ success: false, error: "Cannot modify application while it's under review" }, 400);
                        }
                        if (currentStatus === 'approved') {
                            return jsonResponse({ success: false, error: "Your application has already been approved" }, 400);
                        }

                        // Update existing application (POML fields)
                        await env.proveloce_db.prepare(`
                            UPDATE expert_applications SET
                                profile_phone = ?, 
                                profile_dob = ?, 
                                profile_address = ?,
                                status = 'draft',
                                updated_at = CURRENT_TIMESTAMP
                            WHERE user_id = ?
                        `).bind(
                            body.phone || "",
                            body.dob || "",
                            body.address || "",
                            payload.userId
                        ).run();
                    } else {
                        // Create new application draft
                        const id = crypto.randomUUID();
                        const userOrgId = payload.org_id || 'ORG-DEFAULT';
                        await env.proveloce_db.prepare(`
                            INSERT INTO expert_applications (
                                id, user_id, org_id, status,
                                profile_phone, profile_dob, profile_address,
                                created_at, updated_at
                            ) VALUES (?, ?, ?, 'draft', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                        `).bind(
                            id, payload.userId, userOrgId,
                            body.phone || "",
                            body.dob || "",
                            body.address || ""
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

                    // Notification
                    await createNotification(
                        env, payload.userId, 'INFO',
                        'Application Submitted',
                        'Your expert application has been submitted for review. We will notify you once a decision is made.',
                        '/customer/expert-application'
                    );

                    console.log(`✅ Application submitted for user ${payload.userId}`);
                    return jsonResponse({ success: true, message: "Application submitted successfully" });
                } catch (error: any) {
                    console.error("Error submitting application:", error);
                    return jsonResponse({ success: false, error: "Failed to submit application" }, 500);
                }
            }

            // POST /api/v1/expert_documents/upload - Upload document (POML v1.0)
            if (url.pathname === "/api/v1/expert_documents/upload" && request.method === "POST") {
                const authHeader = request.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const token = authHeader.substring(7);
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret");

                if (!payload) {
                    return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
                }

                if (!env.proveloce_db || !env.EXPERT_APPLICATION) {
                    return jsonResponse({ success: false, error: "Cloud resources not configured" }, 500);
                }

                try {
                    const formData = await request.formData();
                    const file = formData.get("file") as File;
                    const documentType = formData.get("type") as string || "other";

                    if (!file) {
                        return jsonResponse({ success: false, error: "No file provided" }, 400);
                    }

                    // 1. Upload to R2
                    const r2Key = `docs/${payload.userId}/${crypto.randomUUID()}-${file.name.replace(/\s+/g, '_')}`;
                    await env.EXPERT_APPLICATION.put(r2Key, file.stream(), {
                        httpMetadata: { contentType: file.type }
                    });

                    const r2Url = `https://backend.proveloce.com/api/attachments/${r2Key}`;

                    // 2. Get application_id for this user
                    const application = await env.proveloce_db.prepare(
                        "SELECT id FROM expert_applications WHERE user_id = ?"
                    ).bind(payload.userId).first() as any;

                    if (!application) {
                        return jsonResponse({ success: false, error: "Expert application not found" }, 404);
                    }

                    // 3. Save to expert_documents
                    const docId = crypto.randomUUID();
                    await env.proveloce_db.prepare(`
                        INSERT INTO expert_documents (
                            id, user_id, application_id, document_type, 
                            file_name, file_type, file_size, r2_object_key, r2_url
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `).bind(
                        docId, payload.userId, application.id, documentType,
                        file.name, file.type, file.size, r2Key, r2Url
                    ).run();

                    return jsonResponse({
                        success: true,
                        message: "Document uploaded successfully",
                        data: {
                            id: docId,
                            url: r2Url,
                            fileName: file.name
                        }
                    });
                } catch (error: any) {
                    console.error("Error uploading document:", error);
                    return jsonResponse({ success: false, error: "Failed to upload document" }, 500);
                }
            }

            // GET /api/applications - POML Expert Review v1.0: RBAC-filtered applications list
            if (url.pathname === "/api/applications" && request.method === "GET") {
                const authHeader = request.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const token = authHeader.substring(7);
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret");

                if (!payload) {
                    return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
                }

                const role = (payload.role || "").toUpperCase();
                const requesterOrgId = payload.org_id || 'ORG-DEFAULT';

                if (!env.proveloce_db) return jsonResponse({ success: false, error: "Database not configured" }, 500);

                // POML v1.0 RBAC:
                // - Superadmin: view all applications
                // - Admin: view all applications in their org
                // - Expert: view ONLY submitted + validated applications (no drafts)
                let whereClause = "";
                let params: any[] = [];

                if (role === "SUPERADMIN") {
                    // Superadmin sees all
                    whereClause = "1=1";
                } else if (role === "ADMIN") {
                    // Admin sees all in their org
                    whereClause = "org_id = ?";
                    params = [requesterOrgId];
                } else if (role === "EXPERT") {
                    // Expert ONLY sees submitted + validated applications (POML v1.0)
                    whereClause = "org_id = ? AND status = 'submitted' AND validated = 1";
                    params = [requesterOrgId];
                } else {
                    return jsonResponse({ success: false, error: "Access denied" }, 403);
                }

                // Optional status filter from query params
                const statusFilter = url.searchParams.get("status");
                if (statusFilter && role !== "EXPERT") {
                    whereClause += " AND status = ?";
                    params.push(statusFilter);
                }

                try {
                    const result = await env.proveloce_db.prepare(`
                        SELECT ea.*, u.name as user_name, u.email as user_email
                        FROM expert_applications ea
                        LEFT JOIN users u ON ea.user_id = u.id
                        WHERE ${whereClause}
                        ORDER BY ea.created_at DESC
                    `).bind(...params).all();

                    return jsonResponse({
                        success: true,
                        data: { applications: result.results || [] }
                    });
                } catch (error: any) {
                    console.error("Error fetching applications:", error);
                    return jsonResponse({ success: false, error: "Failed to fetch applications" }, 500);
                }
            }

            // POST /api/v1/expert_applications/submit - Spec v2.0 Submission
            if (url.pathname === "/api/v1/expert_applications/submit" && request.method === "POST") {
                const authHeader = request.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const token = authHeader.substring(7);
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret");

                if (!payload || !payload.userId) {
                    return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
                }

                if (!env.proveloce_db) return jsonResponse({ success: false, error: "Database not configured" }, 500);

                try {
                    const body = await request.json() as any;
                    const { full_name, email, phone, address, expertise, experience, documents, images } = body;

                    // Simplified storage as per Spec
                    const id = crypto.randomUUID();
                    const orgId = payload.org_id || 'ORG-DEFAULT';

                    await env.proveloce_db.prepare(`
                        INSERT INTO expert_applications (
                            id, user_id, org_id, status, full_name, email, phone, summary_bio, 
                            skills, years_of_experience, documents, images, submitted_at, created_at, updated_at
                        ) VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    `).bind(
                        id, payload.userId, orgId,
                        full_name || '', email || '', phone || null, address || null,
                        expertise || '', experience || 0,
                        JSON.stringify(documents || []),
                        JSON.stringify(images || [])
                    ).run();

                    // Notification
                    await createNotification(
                        env, payload.userId, 'INFO',
                        'Application Submitted',
                        'Your expert application has been submitted for review. We will notify you once a decision is made.',
                        '/customer/expert-application'
                    );

                    return jsonResponse({ success: true, message: "Application submitted successfully", id });
                } catch (error: any) {
                    console.error("Error in v1 submit:", error);
                    return jsonResponse({ success: false, error: "Failed to submit" }, 500);
                }
            }

            // POST /api/v1/expert_applications/:id/review - Spec v2.0 Unified Review
            const reviewMatch = url.pathname.match(/^\/api\/v1\/expert_applications\/([^\/]+)\/review$/);
            if (reviewMatch && request.method === "POST") {
                const authHeader = request.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) return jsonResponse({ success: false, error: "Unauthorized" }, 401);

                const token = authHeader.substring(7);
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret");

                if (!payload) return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);

                const role = (payload.role || "").toLowerCase();
                const requesterOrgId = payload.org_id || 'ORG-DEFAULT';

                if (role !== "admin" && role !== "superadmin") {
                    return jsonResponse({ success: false, error: "Access denied" }, 403);
                }

                const applicationId = reviewMatch[1];

                const body = await request.json() as any;
                const decision = (body.decision || "").toLowerCase(); // "approved" or "rejected"
                const reason = body.reason || "";

                if (!['approved', 'rejected'].includes(decision)) {
                    return jsonResponse({ success: false, error: "Invalid decision. Must be 'approved' or 'rejected'." }, 400);
                }

                if (!env.proveloce_db) return jsonResponse({ success: false, error: "Database not configured" }, 500);

                // Fetch app to check tenancy and get email for audit
                const app = await env.proveloce_db.prepare(`
                    SELECT ea.user_id, ea.org_id, ea.status, u.email as user_email 
                    FROM expert_applications ea 
                    JOIN users u ON ea.user_id = u.id 
                    WHERE ea.id = ?
                `).bind(applicationId).first() as any;

                if (!app) return jsonResponse({ success: false, error: "Application not found" }, 404);

                if (role === 'admin' && app.org_id !== requesterOrgId) {
                    return jsonResponse({ success: false, error: "Tenant mismatch" }, 403);
                }

                if (app.status.toLowerCase() !== 'pending' && role !== 'superadmin') {
                    return jsonResponse({ success: false, error: "Can only review pending applications" }, 400);
                }

                const reviewerId = payload.userId;
                const status = decision === 'approved' ? 'approved' : 'rejected';
                const auditAction = decision === 'approved' ? 'APPROVE_EXPERT' : 'REJECT_EXPERT';

                // Batch transaction for Atomicity
                const statements = [
                    // 1. Update application status
                    env.proveloce_db.prepare(`
                        UPDATE expert_applications 
                        SET status = ?, 
                            reviewed_by = ?, 
                            rejection_reason = ?,
                            reviewed_at = CURRENT_TIMESTAMP, 
                            updated_at = CURRENT_TIMESTAMP 
                        WHERE id = ?
                    `).bind(status, reviewerId, reason, applicationId),

                    // 2. Audit Log (Spec: audit_logs table)
                    env.proveloce_db.prepare(`
                        INSERT INTO audit_logs (id, action, expert_id, expert_email, reason, performed_by, performed_at)
                        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    `).bind(crypto.randomUUID(), auditAction, applicationId, app.user_email, reason, reviewerId),

                    // 3. Activity Log (Standard: activity_logs table for broad tracking)
                    env.proveloce_db.prepare(`
                        INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `).bind(
                        crypto.randomUUID(), reviewerId, "EXPERT_APPLICATION_REVIEWED", "expert_application", applicationId,
                        JSON.stringify({ decision, reason, org_id: app.org_id, actor_id: reviewerId, actor_role: role, timestamp: new Date().toISOString() })
                    )
                ];

                // If approved, update user role
                if (decision === 'approved') {
                    statements.push(
                        env.proveloce_db.prepare(
                            "UPDATE users SET role = 'Expert', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
                        ).bind(app.user_id)
                    );
                }

                await env.proveloce_db.batch(statements);

                // Notification to Applicant
                if (decision === 'approved') {
                    await createNotification(
                        env, app.user_id, 'SUCCESS',
                        'Application Approved! 🎉',
                        'Congratulations! Your expert application has been approved. You now have access to expert features.',
                        '/expert/dashboard'
                    );
                } else {
                    await createNotification(
                        env, app.user_id, 'WARNING',
                        'Application Status Update',
                        `Your expert application was reviewed and unfortunately was not approved at this time. Reason: ${reason || 'Please check with support for details.'}`,
                        '/customer/expert-application'
                    );
                }

                return jsonResponse({ success: true, message: `Application ${decision} successfully` });
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
                    let attachmentFiles: File[] = [];

                    const contentType = request.headers.get('Content-Type') || '';
                    if (contentType.includes('multipart/form-data')) {
                        const formData = await request.formData();
                        category = formData.get('category') as string || '';
                        subject = formData.get('subject') as string || '';
                        description = formData.get('description') as string || '';

                        // Support multiple files with names 'attachments' or 'attachment'
                        const files = formData.getAll('attachments');
                        const singleFile = formData.get('attachment');

                        if (files.length > 0) {
                            attachmentFiles = files.filter(f => f instanceof File && f.size > 0) as File[];
                        } else if (singleFile && singleFile instanceof File && singleFile.size > 0) {
                            attachmentFiles = [singleFile];
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
                    const ticketNumber = `PV-TK-${yyyymmdd}-${hhmm}`;

                    // Insert into tickets table using Unified Spec v3.0
                    const initialMessage = {
                        sender_id: payload.userId,
                        sender_name: sender?.name || 'User',
                        sender_role: senderRole,
                        text: description.trim(),
                        timestamp: new Date().toISOString()
                    };

                    const result = await env.proveloce_db.prepare(`
                        INSERT INTO tickets (
                            ticket_number, category, subject, description, 
                            raised_by_user_id, org_id, messages, status, created_at, updated_at
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, 'Open', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    `).bind(
                        ticketNumber,
                        category.trim(),
                        subject.trim(),
                        description.trim(),
                        payload.userId,
                        sender.org_id || 'ORG-DEFAULT',
                        JSON.stringify([initialMessage])
                    ).run();

                    const ticketDbId = result.meta.last_row_id;
                    const fileAttachments: any[] = [];

                    // Handle multiple file attachments to R2
                    if (attachmentFiles.length > 0 && env.others) {
                        for (const file of attachmentFiles) {
                            const fileId = crypto.randomUUID();
                            const fileExt = file.name.split('.').pop() || 'bin';
                            const filePath = `helpdesk/${ticketNumber}/${fileId}.${fileExt}`;

                            await env.others.put(filePath, file.stream(), {
                                httpMetadata: { contentType: file.type || 'application/octet-stream' }
                            });

                            const attachmentUrl = `/api/helpdesk/attachments/${filePath}`;

                            // Create FileReference in ticket_files
                            await env.proveloce_db.prepare(`
                                INSERT INTO ticket_files (id, ticket_id, filename, filetype, bucket, uploaded_at)
                                VALUES (?, ?, ?, ?, 'others', CURRENT_TIMESTAMP)
                            `).bind(fileId, ticketDbId, file.name, file.type).run();

                            fileAttachments.push({
                                id: fileId,
                                filename: file.name,
                                url: attachmentUrl
                            });
                        }
                    }

                    return jsonResponse({
                        success: true,
                        message: `Your ticket ${ticketNumber} has been created successfully`,
                        data: {
                            ticketId: ticketNumber,
                            attachments: fileAttachments
                        }
                    });
                } catch (error: any) {
                    console.error("Ticket creation error:", error);
                    return jsonResponse({ success: false, error: error.message || "SERVER_ERROR" }, 500);
                }
            }

            // GET /api/helpdesk/tickets/stats - Dashboard statistics for tickets (Enterprise v3.0)
            if (url.pathname === "/api/helpdesk/tickets/stats" && request.method === "GET") {
                const authHeader = request.headers.get("Authorization") || "";
                const token = authHeader.replace("Bearer ", "");
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret") as { userId: string } | null;
                if (!payload) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                // Get user role for role-based visibility
                const user = await env.proveloce_db.prepare(
                    "SELECT role, org_id FROM users WHERE id = ?"
                ).bind(payload.userId).first() as any;
                const role = user?.role?.toUpperCase() || '';
                const orgId = user?.org_id || 'ORG-DEFAULT';

                const isSuperAdmin = role === 'SUPERADMIN';
                const isAdmin = role === 'ADMIN';

                // Build where clause based on role
                let whereClause = "";
                let params: any[] = [];
                
                if (isSuperAdmin) {
                    // Superadmin sees all tickets
                    whereClause = "WHERE 1=1";
                } else if (isAdmin) {
                    // Admin sees tickets in their org or assigned to them
                    whereClause = "WHERE (t.org_id = ? OR t.assigned_user_id = ?)";
                    params = [orgId, payload.userId];
                } else {
                    // Regular users see only their own tickets
                    whereClause = "WHERE t.raised_by_user_id = ?";
                    params = [payload.userId];
                }

                // Get ticket counts by status
                const statusCountsQuery = `
                    SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) as open_count,
                        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_count,
                        SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved_count,
                        SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) as closed_count
                    FROM tickets t ${whereClause}
                `;
                const statusCounts = await env.proveloce_db.prepare(statusCountsQuery).bind(...params).first() as any;

                // Get ticket counts by priority
                const priorityCountsQuery = `
                    SELECT 
                        priority,
                        COUNT(*) as count
                    FROM tickets t ${whereClause}
                    GROUP BY priority
                `;
                const priorityCounts = await env.proveloce_db.prepare(priorityCountsQuery).bind(...params).all();

                // Get ticket counts by category
                const categoryCountsQuery = `
                    SELECT 
                        category,
                        COUNT(*) as count
                    FROM tickets t ${whereClause}
                    GROUP BY category
                    ORDER BY count DESC
                    LIMIT 10
                `;
                const categoryCounts = await env.proveloce_db.prepare(categoryCountsQuery).bind(...params).all();

                // Get tickets created over time (last 30 days)
                const trendQuery = `
                    SELECT 
                        DATE(created_at) as date,
                        COUNT(*) as count
                    FROM tickets t ${whereClause}
                    AND created_at >= datetime('now', '-30 days')
                    GROUP BY DATE(created_at)
                    ORDER BY date ASC
                `;
                const ticketTrend = await env.proveloce_db.prepare(trendQuery).bind(...params).all();

                // Get average resolution time (for closed tickets)
                const resolutionQuery = `
                    SELECT 
                        AVG(
                            CAST((julianday(updated_at) - julianday(created_at)) * 24 AS REAL)
                        ) as avg_hours
                    FROM tickets t ${whereClause}
                    AND status IN ('Resolved', 'Closed')
                `;
                const resolutionTime = await env.proveloce_db.prepare(resolutionQuery).bind(...params).first() as any;

                // Get recent tickets
                const recentTicketsQuery = `
                    SELECT 
                        t.id,
                        t.ticket_number,
                        t.subject,
                        t.status,
                        t.priority,
                        t.category,
                        t.created_at,
                        t.updated_at,
                        u.name as raised_by_name
                    FROM tickets t
                    LEFT JOIN users u ON t.raised_by_user_id = u.id
                    ${whereClause}
                    ORDER BY t.created_at DESC
                    LIMIT 5
                `;
                const recentTickets = await env.proveloce_db.prepare(recentTicketsQuery).bind(...params).all();

                // Get workload distribution (tickets per assigned user)
                let workloadDistribution: any[] = [];
                if (isSuperAdmin || isAdmin) {
                    const workloadQuery = `
                        SELECT 
                            u.name as assignee_name,
                            COUNT(t.id) as ticket_count,
                            SUM(CASE WHEN t.status = 'Open' THEN 1 ELSE 0 END) as open_count,
                            SUM(CASE WHEN t.status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_count
                        FROM tickets t
                        LEFT JOIN users u ON t.assigned_user_id = u.id
                        WHERE t.assigned_user_id IS NOT NULL
                        ${isSuperAdmin ? '' : 'AND t.org_id = ?'}
                        GROUP BY t.assigned_user_id, u.name
                        ORDER BY ticket_count DESC
                        LIMIT 10
                    `;
                    const workload = await env.proveloce_db.prepare(workloadQuery)
                        .bind(...(isSuperAdmin ? [] : [orgId]))
                        .all();
                    workloadDistribution = workload.results || [];
                }

                // Format priority counts
                const priorityData: Record<string, number> = {};
                for (const p of (priorityCounts.results || []) as any[]) {
                    priorityData[p.priority || 'medium'] = p.count;
                }

                // Format category counts
                const categoryData = ((categoryCounts.results || []) as any[]).map(c => ({
                    name: c.category || 'General',
                    value: c.count
                }));

                // Format trend data
                const trendData = ((ticketTrend.results || []) as any[]).map(t => ({
                    date: t.date,
                    count: t.count
                }));

                return jsonResponse({
                    success: true,
                    data: {
                        summary: {
                            total: statusCounts?.total || 0,
                            open: statusCounts?.open_count || 0,
                            inProgress: statusCounts?.in_progress_count || 0,
                            resolved: statusCounts?.resolved_count || 0,
                            closed: statusCounts?.closed_count || 0,
                            avgResolutionHours: Math.round((resolutionTime?.avg_hours || 0) * 10) / 10
                        },
                        byPriority: {
                            low: priorityData['low'] || 0,
                            medium: priorityData['medium'] || 0,
                            high: priorityData['high'] || 0,
                            urgent: priorityData['urgent'] || 0
                        },
                        byCategory: categoryData,
                        trend: trendData,
                        workload: workloadDistribution,
                        recentTickets: recentTickets.results || []
                    }
                });
            }

            // GET /api/helpdesk/tickets - Unified Ticket Visibility (Enterprise v2.0)
            if (url.pathname === "/api/helpdesk/tickets" && request.method === "GET") {
                const authHeader = request.headers.get("Authorization") || "";
                const token = authHeader.replace("Bearer ", "");
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret") as { userId: string } | null;
                if (!payload) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const requester = await env.proveloce_db.prepare(
                    "SELECT role, org_id FROM users WHERE id = ?"
                ).bind(payload.userId).first() as any;

                const role = requester?.role?.toUpperCase() || 'CUSTOMER';
                const requesterOrgId = requester?.org_id || 'ORG-DEFAULT';

                // Unified Visibility Logic (POML Spec v1.0):
                // Superadmin: view_all(tickets)
                // Admin: view_ticket(assigned_only) WHERE org_id = requesterOrgId
                // Expert: view_ticket(assigned_only) WHERE org_id = requesterOrgId
                // Customer: view_ticket(raised_only) WHERE org_id = requesterOrgId

                let whereClause = '';
                let params: any[] = [];

                if (role === 'SUPERADMIN') {
                    whereClause = '';
                } else if (role === 'ADMIN') {
                    // Admins only see tickets assigned to them
                    whereClause = 't.org_id = ? AND t.assigned_user_id = ?';
                    params = [requesterOrgId, payload.userId];
                } else if (role === 'EXPERT') {
                    // Experts only see tickets assigned to them (cannot respond per POML)
                    whereClause = 't.org_id = ? AND t.assigned_user_id = ?';
                    params = [requesterOrgId, payload.userId];
                } else {
                    // Customers see only tickets they raised
                    whereClause = 't.org_id = ? AND t.raised_by_user_id = ?';
                    params = [requesterOrgId, payload.userId];
                }

                const query = `
                    SELECT 
                        t.*,
                        t.ticket_number as ticket_id,
                        u_raised.name as user_full_name,
                        u_raised.email as user_email,
                        u_assign.name as assigned_user_name,
                        u_assign.role as assigned_user_role
                    FROM tickets t
                    LEFT JOIN users u_raised ON t.raised_by_user_id = u_raised.id
                    LEFT JOIN users u_assign ON t.assigned_user_id = u_assign.id
                    ${whereClause ? 'WHERE ' + whereClause : ''}
                    ORDER BY t.created_at DESC
                `;

                const result = await env.proveloce_db.prepare(query).bind(...params).all();
                const rawTickets = result.results || [];

                // Fetch attachments for each ticket
                const ticketsWithFiles = await Promise.all(rawTickets.map(async (t: any) => {
                    const files = await env.proveloce_db.prepare(`
                        SELECT id, filename, filetype, bucket, uploaded_at
                        FROM ticket_files WHERE ticket_id = ?
                    `).bind(t.id).all();

                    return {
                        ...t,
                        attachments: (files.results || []).map((f: any) => ({
                            ...f,
                            url: `/api/helpdesk/attachments/helpdesk/${t.ticket_number}/${f.id}.${f.filename.split('.').pop() || 'bin'}`
                        }))
                    };
                }));

                return jsonResponse({
                    success: true,
                    data: { tickets: ticketsWithFiles }
                });
            }

            // GET /api/helpdesk/tickets/:ticket_id - Enterprise Retrieval (v2.0)
            if (url.pathname.match(/^\/api\/helpdesk\/tickets\/[^\/]+$/) && !url.pathname.includes('/status') && !url.pathname.includes('/messages') && !url.pathname.includes('/assign') && request.method === "GET") {
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
                        t.ticket_number as ticket_id,
                        u_raised.name as user_full_name,
                        u_raised.email as user_email,
                        u_raised.phone as user_phone_number,
                        u_raised.org_id as user_org_id,
                        u_assign.name as assigned_user_name,
                        u_assign.role as assigned_user_role,
                        u_assign.org_id as assigned_user_org_id
                    FROM tickets t
                    LEFT JOIN users u_raised ON t.raised_by_user_id = u_raised.id
                    LEFT JOIN users u_assign ON t.assigned_user_id = u_assign.id
                    WHERE t.id = ? OR t.ticket_number = ?
                `).bind(ticketId, ticketId).first() as any;

                if (!ticket) {
                    return jsonResponse({ success: false, error: "Ticket not found" }, 404);
                }

                // Tenant Isolation Check (Spec v1.0)
                const requester = await env.proveloce_db.prepare(
                    "SELECT role, org_id FROM users WHERE id = ?"
                ).bind(payload.userId).first() as any;

                const requesterOrgId = requester?.org_id || 'ORG-DEFAULT';
                const requesterRole = requester?.role?.toUpperCase() || '';

                if (ticket.org_id !== requesterOrgId && requesterRole !== 'SUPERADMIN') {
                    return jsonResponse({ success: false, error: "TENANT_MISMATCH", message: "Unauthorized tenant access." }, 403);
                }

                // Check visibility permissions: Superadmin OR Raised User OR Assigned User
                const isRaisedByMe = ticket.raised_by_user_id === payload.userId;
                const isAssignedToMe = ticket.assigned_user_id === payload.userId;
                const isSuperAdmin = requesterRole === 'SUPERADMIN';
                const isAdmin = requesterRole === 'ADMIN';

                // Admins can see all tickets in their Org? Spec implies assignment RBAC but visibility usually follows.
                // Spec says "All operations scoped to org_id".
                if (!isSuperAdmin && !isAdmin && !isRaisedByMe && !isAssignedToMe) {
                    return jsonResponse({ success: false, error: "Not authorized to view this ticket" }, 403);
                }

                // Fetch attachments
                const files = await env.proveloce_db.prepare(`
                    SELECT id, filename, filetype, bucket, uploaded_at
                    FROM ticket_files WHERE ticket_id = ?
                `).bind(ticket.id).all();

                const attachments = (files.results || []).map((f: any) => ({
                    ...f,
                    url: `/api/helpdesk/attachments/helpdesk/${ticket.ticket_number}/${f.id}.${f.filename.split('.').pop() || 'bin'}`
                }));

                // Parse messages from JSON
                let messages = [];
                try {
                    messages = typeof ticket.messages === 'string' ? JSON.parse(ticket.messages) : (ticket.messages || []);
                } catch (e) {
                    console.error("Failed to parse ticket messages JSON", e);
                }

                return jsonResponse({
                    success: true,
                    data: {
                        ticket: {
                            ...ticket,
                            attachments
                        },
                        messages
                    }
                });
            }

            // PATCH /api/helpdesk/tickets/:ticket_id/status - Update ticket status only (Enterprise v3.0)
            // Rules:
            // - Status can be edited unlimited times
            // - Only assigned user and superadmin can update status
            // - Only status field is editable (not other ticket details)
            // - Proper audit logging for each status change
            if (url.pathname.match(/^\/api\/helpdesk\/tickets\/[^\/]+\/status$/) && request.method === "PATCH") {
                const authHeader = request.headers.get("Authorization") || "";
                const token = authHeader.replace("Bearer ", "");
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret") as { userId: string } | null;
                if (!payload) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const ticketId = url.pathname.split('/')[4];
                const body = await request.json() as any;
                const { status } = body;

                // Status mapping to Spec v3.0: Open, In Progress, Resolved, Closed
                let finalStatus = status;
                if (status === 'APPROVED' || status === 'OPEN') finalStatus = 'Open';
                else if (status === 'IN_PROGRESS') finalStatus = 'In Progress';
                else if (status === 'RESOLVED') finalStatus = 'Resolved';
                else if (status === 'REJECTED' || status === 'CLOSED') finalStatus = 'Closed';

                const validStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
                if (!finalStatus || !validStatuses.includes(finalStatus)) {
                    return jsonResponse({
                        success: false,
                        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
                    }, 400);
                }

                // Get requester info for role-based access control
                const user = await env.proveloce_db.prepare(
                    "SELECT name, role FROM users WHERE id = ?"
                ).bind(payload.userId).first() as any;

                const role = user?.role?.toUpperCase() || '';
                const userName = user?.name || 'Unknown';

                // Get ticket to check permission
                const ticket = await env.proveloce_db.prepare(
                    "SELECT * FROM tickets WHERE id = ? OR ticket_number = ?"
                ).bind(ticketId, ticketId).first() as any;

                if (!ticket) {
                    return jsonResponse({ success: false, error: "Ticket not found" }, 404);
                }

                // Store previous status for audit logging
                const previousStatus = ticket.status;

                // Role-based access control:
                // Only SuperAdmin or Assigned User can update status (unlimited times)
                const isSuperAdmin = role === 'SUPERADMIN';
                const isAssigned = ticket.assigned_user_id === payload.userId;

                if (!isSuperAdmin && !isAssigned) {
                    return jsonResponse({ 
                        success: false, 
                        error: "Only SuperAdmin or the Assigned Responder can update the status of this ticket" 
                    }, 403);
                }

                // Update only the status field (no edit limits)
                const updateQuery = "UPDATE tickets SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? OR ticket_number = ?";
                await env.proveloce_db.prepare(updateQuery).bind(finalStatus, ticketId, ticketId).run();

                // AUDIT TRAIL - log every status change with full details
                const logId = crypto.randomUUID();
                const auditMetadata = {
                    previous_status: previousStatus,
                    new_status: finalStatus,
                    updated_by: userName,
                    updated_by_role: role,
                    ticket_number: ticket.ticket_number
                };
                await env.proveloce_db.prepare(`
                    INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata)
                    VALUES (?, ?, ?, ?, ?, ?)
                `).bind(logId, payload.userId, 'UPDATE_TICKET_STATUS', 'TICKET', ticketId, JSON.stringify(auditMetadata)).run();

                return jsonResponse({
                    success: true,
                    message: "Ticket status updated successfully",
                    data: { 
                        ticketId, 
                        previousStatus,
                        status: finalStatus,
                        updatedBy: userName,
                        updatedByRole: role
                    }
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

                // Verify requester is SuperAdmin (Spec v3.0: superadmin_only)
                const requester = await env.proveloce_db.prepare(
                    "SELECT role, org_id, suspended FROM users WHERE id = ?"
                ).bind(payload.userId).first() as any;
                const requesterRole = requester?.role?.toUpperCase() || '';
                const requesterOrgId = requester?.org_id || 'ORG-DEFAULT';

                if (requester.suspended === 1) {
                    return jsonResponse({ success: false, error: "ACCOUNT_SUSPENDED", message: "Account is suspended." }, 403);
                }

                if (requesterRole !== 'SUPERADMIN' && requesterRole !== 'ADMIN') {
                    return jsonResponse({ success: false, error: "Only Admins can assign tickets" }, 403);
                }

                // Verify assigned user exists, has correct role, and same tenant
                const assignedUser = await env.proveloce_db.prepare(
                    "SELECT name, role, org_id, suspended FROM users WHERE id = ?"
                ).bind(assignedToId).first() as any;

                if (!assignedUser) {
                    return jsonResponse({ success: false, error: "Assigned user not found" }, 404);
                }

                if (assignedUser.role?.toUpperCase() !== 'ADMIN' && assignedUser.role?.toUpperCase() !== 'SUPERADMIN' && assignedUser.role?.toUpperCase() !== 'EXPERT') {
                    return jsonResponse({ success: false, error: "Tickets can only be assigned to ADMIN, SUPERADMIN, or EXPERT" }, 400);
                }

                if (assignedUser.org_id !== requesterOrgId && requesterRole !== 'SUPERADMIN') {
                    // SuperAdmin can cross-assign? Spec says "cross-tenant assignment is forbidden"
                    return jsonResponse({ success: false, error: "TENANT_MISMATCH", message: "Cannot assign across tenants." }, 403);
                }

                if (assignedUser.suspended === 1) {
                    return jsonResponse({ success: false, error: "TARGET_SUSPENDED", message: "Cannot assign to a suspended user." }, 400);
                }

                // Fetch ticket to check tenancy and status
                const ticket = await env.proveloce_db.prepare(
                    "SELECT org_id, status, locked_by FROM tickets WHERE id = ? OR ticket_number = ?"
                ).bind(ticketId, ticketId).first() as any;

                if (!ticket) {
                    return jsonResponse({ success: false, error: "Ticket not found" }, 404);
                }

                if (ticket.org_id !== requesterOrgId && requesterRole !== 'SUPERADMIN') {
                    return jsonResponse({ success: false, error: "TENANT_MISMATCH", message: "Unauthorized tenant access." }, 403);
                }

                if (['CLOSED', 'RESOLVED'].includes(ticket.status.toUpperCase())) {
                    return jsonResponse({ success: false, error: "TICKET_CLOSED", message: "Cannot assign closed or resolved tickets." }, 400);
                }

                if (ticket.locked_by && ticket.locked_by !== payload.userId && requesterRole !== 'SUPERADMIN') {
                    return jsonResponse({ success: false, error: "TICKET_LOCKED", message: "Ticket is locked by another user." }, 403);
                }

                // Update ticket
                await env.proveloce_db.prepare(`
                    UPDATE tickets SET 
                        assigned_user_id = ?,
                        assignee_role = ?,
                        assigned_at = CURRENT_TIMESTAMP,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ? OR ticket_number = ?
                `).bind(assignedToId, assignedUser.role, ticketId, ticketId).run();

                // AUDIT TRAIL
                const logId = crypto.randomUUID();
                const logMessage = `Ticket ${ticketId} assigned to ${assignedUser.username || assignedUser.name} by superadmin`;
                await env.proveloce_db.prepare(`
                    INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata)
                    VALUES (?, ?, ?, ?, ?, ?)
                `).bind(logId, payload.userId, 'ASSIGN_TICKET', 'TICKET', ticketId, JSON.stringify({ message: logMessage, assignedTo: assignedToId })).run();

                return jsonResponse({
                    success: true,
                    message: "Ticket assigned successfully"
                });
            }

            // POST /api/helpdesk/tickets/:ticket_id/reassign - Reassign ticket (Spec v1.0)
            if (url.pathname.match(/^\/api\/helpdesk\/tickets\/[^\/]+\/reassign$/) && request.method === "POST") {
                const authHeader = request.headers.get("Authorization") || "";
                const token = authHeader.replace("Bearer ", "");
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret") as { userId: string } | null;
                if (!payload) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const ticketId = url.pathname.split('/')[4];
                const { assignedToId } = await request.json() as { assignedToId: string };

                const requester = await env.proveloce_db.prepare("SELECT role, org_id FROM users WHERE id = ?").bind(payload.userId).first() as any;
                const requesterOrgId = requester?.org_id || 'ORG-DEFAULT';
                const requesterRole = requester?.role?.toUpperCase() || '';

                if (requesterRole !== 'SUPERADMIN' && requesterRole !== 'ADMIN') {
                    return jsonResponse({ success: false, error: "FORBIDDEN", message: "Role not permitted to reassign." }, 403);
                }

                const assignedUser = await env.proveloce_db.prepare("SELECT name, role, org_id FROM users WHERE id = ?").bind(assignedToId).first() as any;
                if (!assignedUser || assignedUser.org_id !== requesterOrgId && requesterRole !== 'SUPERADMIN') {
                    return jsonResponse({ success: false, error: "INVALID_ASSIGNEE", message: "Assignee must be in same tenant." }, 403);
                }

                const ticket = await env.proveloce_db.prepare("SELECT org_id, assigned_user_id FROM tickets WHERE id = ? OR ticket_number = ?").bind(ticketId, ticketId).first() as any;
                if (!ticket || ticket.org_id !== requesterOrgId && requesterRole !== 'SUPERADMIN') {
                    return jsonResponse({ success: false, error: "TICKET_NOT_FOUND" }, 404);
                }

                const prevAssigneeId = ticket.assigned_user_id;

                await env.proveloce_db.prepare(`
                    UPDATE tickets SET assigned_user_id = ?, assignee_role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? OR ticket_number = ?
                `).bind(assignedToId, assignedUser.role, ticketId, ticketId).run();

                // Audit
                await env.proveloce_db.prepare(`
                    INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata)
                    VALUES (?, ?, ?, ?, ?, ?)
                `).bind(crypto.randomUUID(), payload.userId, 'REASSIGN_TICKET', 'TICKET', ticketId, JSON.stringify({ assignedTo: assignedToId, previousAssignee: prevAssigneeId })).run();

                return jsonResponse({ success: true, message: "Ticket reassigned" });
            }

            // POST /api/helpdesk/tickets/:ticket_id/unassign - Unassign ticket (Spec v1.0)
            if (url.pathname.match(/^\/api\/helpdesk\/tickets\/[^\/]+\/unassign$/) && request.method === "POST") {
                const authHeader = request.headers.get("Authorization") || "";
                const token = authHeader.replace("Bearer ", "");
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret") as { userId: string } | null;
                if (!payload) return jsonResponse({ success: false, error: "Unauthorized" }, 401);

                const ticketId = url.pathname.split('/')[4];
                const requester = await env.proveloce_db.prepare("SELECT role, org_id FROM users WHERE id = ?").bind(payload.userId).first() as any;
                const requesterOrgId = requester?.org_id || 'ORG-DEFAULT';

                const ticket = await env.proveloce_db.prepare("SELECT org_id FROM tickets WHERE id = ? OR ticket_number = ?").bind(ticketId, ticketId).first() as any;
                if (!ticket || ticket.org_id !== requesterOrgId && requester.role?.toUpperCase() !== 'SUPERADMIN') {
                    return jsonResponse({ success: false, error: "UNAUTHORIZED" }, 403);
                }

                await env.proveloce_db.prepare(`
                    UPDATE tickets SET assigned_user_id = NULL, assignee_role = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ? OR ticket_number = ?
                `).bind(ticketId, ticketId).run();

                return jsonResponse({ success: true, message: "Ticket unassigned" });
            }

            // POST /api/helpdesk/tickets/:ticket_id/messages - Add message to thread (Enterprise v3.0)
            // Rules:
            // - Messages are NON-EDITABLE once submitted (stored in JSON array)
            // - Both ticket raiser and assigned reviewer can send messages
            // - SuperAdmin can always send messages
            // - Messages blocked when ticket is Closed
            if (url.pathname.match(/^\/api\/helpdesk\/tickets\/[^\/]+\/messages$/) && request.method === "POST") {
                const authHeader = request.headers.get("Authorization") || "";
                const token = authHeader.replace("Bearer ", "");
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret") as { userId: string } | null;
                if (!payload) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const ticketId = url.pathname.split('/')[4];
                const body = await request.json() as { message?: string, content?: string };
                // Accept both 'message' and 'content' field names for compatibility
                const messageText = body.message || body.content;

                if (!messageText || !messageText.trim()) {
                    return jsonResponse({ success: false, error: "Message is required" }, 400);
                }

                // Get requester info
                const user = await env.proveloce_db.prepare(
                    "SELECT name, role FROM users WHERE id = ?"
                ).bind(payload.userId).first() as any;
                const role = user?.role?.toUpperCase() || 'CUSTOMER';
                const userName = user?.name || 'Unknown';

                // Get ticket to check permissions
                const ticket = await env.proveloce_db.prepare(
                    "SELECT * FROM tickets WHERE id = ? OR ticket_number = ?"
                ).bind(ticketId, ticketId).first() as any;

                if (!ticket) {
                    return jsonResponse({ success: false, error: "Ticket not found" }, 404);
                }

                // Block messages on closed tickets
                if (ticket.status === 'Closed') {
                    return jsonResponse({ 
                        success: false, 
                        error: "Cannot add messages to a closed ticket" 
                    }, 400);
                }

                // Permission check:
                // - SuperAdmin: can always message
                // - Assigned user: can message
                // - Ticket raiser: can message (two-way conversation)
                const isSuperAdmin = role === 'SUPERADMIN';
                const isAssigned = ticket.assigned_user_id === payload.userId;
                const isRaiser = ticket.raised_by_user_id === payload.userId;

                if (!isSuperAdmin && !isAssigned && !isRaiser) {
                    return jsonResponse({ 
                        success: false, 
                        error: "Not authorized to send messages on this ticket" 
                    }, 403);
                }

                // Create a new message (messages are immutable - no edit capability)
                const messageId = crypto.randomUUID();
                const now = new Date().toISOString();

                const newMessage = {
                    id: messageId,
                    senderId: payload.userId,
                    senderName: userName,
                    senderRole: role,
                    content: messageText.trim(),
                    createdAt: now
                };

                // Parse existing messages and append new one
                let existingMessages: any[] = [];
                try {
                    existingMessages = JSON.parse(ticket.messages || '[]');
                } catch {
                    existingMessages = [];
                }
                existingMessages.push(newMessage);

                // Update ticket with new messages array (messages are immutable once added)
                await env.proveloce_db.prepare(`
                    UPDATE tickets SET messages = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? OR ticket_number = ?
                `).bind(JSON.stringify(existingMessages), ticketId, ticketId).run();

                // AUDIT TRAIL
                const logId = crypto.randomUUID();
                const auditMetadata = {
                    message_id: messageId,
                    sender_name: userName,
                    sender_role: role,
                    ticket_number: ticket.ticket_number,
                    message_count: existingMessages.length
                };
                await env.proveloce_db.prepare(`
                    INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata)
                    VALUES (?, ?, ?, ?, ?, ?)
                `).bind(logId, payload.userId, 'ADD_TICKET_MESSAGE', 'TICKET', ticketId, JSON.stringify(auditMetadata)).run();

                return jsonResponse({
                    success: true,
                    message: "Message added successfully",
                    data: newMessage
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
            // POML Task Assignment - CRUD Endpoints
            // =====================================================

            // GET /api/tasks - List tasks
            if (url.pathname === "/api/tasks" && request.method === "GET") {
                const authHeader = request.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const token = authHeader.substring(7);
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret");
                if (!payload) return jsonResponse({ success: false, error: "Invalid token" }, 401);

                const role = (payload.role || "").toUpperCase();
                const requesterOrgId = payload.org_id || 'ORG-DEFAULT';

                if (!env.proveloce_db) return jsonResponse({ success: false, error: "Database not configured" }, 500);

                let whereClause = "";
                let params: any[] = [];

                if (role === "SUPERADMIN") {
                    whereClause = "1=1";
                } else if (role === "ADMIN") {
                    whereClause = "t.org_id = ?";
                    params = [requesterOrgId];
                } else {
                    // Experts and others see only tasks assigned to them
                    whereClause = "t.assigned_to = ?";
                    params = [payload.userId];
                }

                try {
                    const result = await env.proveloce_db.prepare(`
                        SELECT t.*, u.name as assigned_user_name
                        FROM tasks t
                        LEFT JOIN users u ON t.assigned_to = u.id
                        WHERE ${whereClause}
                        ORDER BY t.created_at DESC
                    `).bind(...params).all();

                    return jsonResponse({
                        success: true,
                        data: { tasks: result.results || [] }
                    });
                } catch (error: any) {
                    console.error("Error fetching tasks:", error);
                    return jsonResponse({ success: false, error: "Failed to fetch tasks" }, 500);
                }
            }

            // POST /api/tasks - Create task
            if (url.pathname === "/api/tasks" && request.method === "POST") {
                const authHeader = request.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const token = authHeader.substring(7);
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret");
                if (!payload) return jsonResponse({ success: false, error: "Invalid token" }, 401);

                const role = (payload.role || "").toUpperCase();
                if (role !== "ADMIN" && role !== "SUPERADMIN") {
                    return jsonResponse({ success: false, error: "Only admins can create tasks" }, 403);
                }

                if (!env.proveloce_db) return jsonResponse({ success: false, error: "Database not configured" }, 500);

                try {
                    const body = await request.json() as {
                        title: string;
                        description: string;
                        assignedTo?: string;
                        dueDate?: string;
                    };

                    if (!body.title || !body.description) {
                        return jsonResponse({ success: false, error: "Title and description are required" }, 400);
                    }

                    const taskId = crypto.randomUUID();
                    const orgId = payload.org_id || 'ORG-DEFAULT';

                    await env.proveloce_db.prepare(`
                        INSERT INTO tasks (id, title, description, assigned_to, due_date, status, org_id, created_by, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, 'Pending', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    `).bind(
                        taskId,
                        body.title,
                        body.description,
                        body.assignedTo || null,
                        body.dueDate || null,
                        orgId,
                        payload.userId
                    ).run();

                    // Notify assigned user if any
                    if (body.assignedTo) {
                        await createNotification(
                            env, body.assignedTo, 'INFO',
                            'New Task Assigned',
                            `You have been assigned a new task: ${body.title}`,
                            '/expert/tasks'
                        );
                    }

                    return jsonResponse({ success: true, message: "Task created", id: taskId });
                } catch (error: any) {
                    console.error("Error creating task:", error);
                    return jsonResponse({ success: false, error: "Failed to create task" }, 500);
                }
            }

            // GET /api/tasks/:id - Get single task
            const taskIdMatch = url.pathname.match(/^\/api\/tasks\/([^\/]+)$/);
            if (taskIdMatch && request.method === "GET") {
                const authHeader = request.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const token = authHeader.substring(7);
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret");
                if (!payload) return jsonResponse({ success: false, error: "Invalid token" }, 401);

                const taskId = taskIdMatch[1];

                if (!env.proveloce_db) return jsonResponse({ success: false, error: "Database not configured" }, 500);

                try {
                    const task = await env.proveloce_db.prepare(`
                        SELECT t.*, u.name as assigned_user_name
                        FROM tasks t
                        LEFT JOIN users u ON t.assigned_to = u.id
                        WHERE t.id = ?
                    `).bind(taskId).first();

                    if (!task) {
                        return jsonResponse({ success: false, error: "Task not found" }, 404);
                    }

                    return jsonResponse({ success: true, data: { task } });
                } catch (error: any) {
                    console.error("Error fetching task:", error);
                    return jsonResponse({ success: false, error: "Failed to fetch task" }, 500);
                }
            }

            // PATCH /api/tasks/:id - Update task
            if (taskIdMatch && request.method === "PATCH") {
                const authHeader = request.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const token = authHeader.substring(7);
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret");
                if (!payload) return jsonResponse({ success: false, error: "Invalid token" }, 401);

                const taskId = taskIdMatch[1];

                if (!env.proveloce_db) return jsonResponse({ success: false, error: "Database not configured" }, 500);

                try {
                    const body = await request.json() as { status?: string; assignedTo?: string };

                    const updates: string[] = [];
                    const params: any[] = [];

                    if (body.status) {
                        updates.push("status = ?");
                        params.push(body.status);
                    }
                    if (body.assignedTo !== undefined) {
                        updates.push("assigned_to = ?");
                        params.push(body.assignedTo || null);
                    }
                    updates.push("updated_at = CURRENT_TIMESTAMP");

                    params.push(taskId);

                    await env.proveloce_db.prepare(`
                        UPDATE tasks SET ${updates.join(", ")} WHERE id = ?
                    `).bind(...params).run();

                    return jsonResponse({ success: true, message: "Task updated" });
                } catch (error: any) {
                    console.error("Error updating task:", error);
                    return jsonResponse({ success: false, error: "Failed to update task" }, 500);
                }
            }

            // =====================================================
            // Expert Connect - Search & Discovery
            // =====================================================

            // GET /api/experts/search - Search experts with filters
            if (url.pathname === "/api/experts/search" && request.method === "GET") {
                const authHeader = request.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const token = authHeader.substring(7);
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret");
                if (!payload) return jsonResponse({ success: false, error: "Invalid token" }, 401);

                if (!env.proveloce_db) return jsonResponse({ success: false, error: "Database not configured" }, 500);

                const domain = url.searchParams.get("domain");
                const slotLabel = url.searchParams.get("slot_label");
                const dayType = url.searchParams.get("day_type");

                try {
                    let query = `
                        SELECT DISTINCT u.id, u.name, u.email, u.role, u.status
                        FROM users u
                        LEFT JOIN expert_time_slots s ON s.expert_id = u.id
                        WHERE UPPER(u.role) = 'EXPERT' AND UPPER(u.status) = 'ACTIVE'
                    `;
                    const params: any[] = [];

                    if (slotLabel) {
                        query += ` AND s.slot_label = ?`;
                        params.push(slotLabel);
                    }
                    if (dayType) {
                        query += ` AND (s.day_type = ? OR s.day_type = 'both')`;
                        params.push(dayType);
                    }

                    query += ` ORDER BY u.name ASC`;

                    const result = await env.proveloce_db.prepare(query).bind(...params).all();

                    return jsonResponse({
                        success: true,
                        data: { experts: result.results || [] }
                    });
                } catch (error: any) {
                    console.error("Error searching experts:", error);
                    return jsonResponse({ success: false, error: "Failed to search experts" }, 500);
                }
            }

            // GET /api/experts/:id/public - Get expert public profile
            const expertPublicMatch = url.pathname.match(/^\/api\/experts\/([^\/]+)\/public$/);
            if (expertPublicMatch && request.method === "GET") {
                const authHeader = request.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const token = authHeader.substring(7);
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret");
                if (!payload) return jsonResponse({ success: false, error: "Invalid token" }, 401);

                const expertId = expertPublicMatch[1];

                if (!env.proveloce_db) return jsonResponse({ success: false, error: "Database not configured" }, 500);

                try {
                    // Get public profile (non-confidential only)
                    const expert = await env.proveloce_db.prepare(`
                        SELECT id, name, role, status, created_at
                        FROM users WHERE id = ? AND UPPER(role) = 'EXPERT'
                    `).bind(expertId).first();

                    if (!expert) {
                        return jsonResponse({ success: false, error: "Expert not found" }, 404);
                    }

                    // Get expert's time slots
                    const slots = await env.proveloce_db.prepare(`
                        SELECT slot_label, day_type FROM expert_time_slots WHERE expert_id = ?
                    `).bind(expertId).all();

                    return jsonResponse({
                        success: true,
                        data: {
                            expert,
                            slots: slots.results || []
                        }
                    });
                } catch (error: any) {
                    console.error("Error fetching expert:", error);
                    return jsonResponse({ success: false, error: "Failed to fetch expert" }, 500);
                }
            }

            // =====================================================
            // Expert Connect - Connect Requests
            // =====================================================

            // POST /api/connect-requests - Create connect request
            if (url.pathname === "/api/connect-requests" && request.method === "POST") {
                const authHeader = request.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const token = authHeader.substring(7);
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret");
                if (!payload) return jsonResponse({ success: false, error: "Invalid token" }, 401);

                if (!env.proveloce_db) return jsonResponse({ success: false, error: "Database not configured" }, 500);

                try {
                    const body = await request.json() as {
                        expertId: string;
                        requestedDate: string;
                        requestedDayType: string;
                        requestedSlotLabel: string;
                        customerNote?: string;
                    };

                    if (!body.expertId || !body.requestedDate || !body.requestedDayType || !body.requestedSlotLabel) {
                        return jsonResponse({ success: false, error: "Missing required fields" }, 400);
                    }

                    const requestId = crypto.randomUUID();

                    await env.proveloce_db.prepare(`
                        INSERT INTO connect_requests (id, customer_id, expert_id, requested_date, requested_day_type, requested_slot_label, customer_note, status)
                        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
                    `).bind(
                        requestId,
                        payload.userId,
                        body.expertId,
                        body.requestedDate,
                        body.requestedDayType,
                        body.requestedSlotLabel,
                        body.customerNote || null
                    ).run();

                    // Notify expert
                    await createNotification(
                        env,
                        body.expertId,
                        'INFO',
                        'New Connect Request',
                        'You have received a new connect request.',
                        '/expert/connect-requests'
                    );

                    return jsonResponse({ success: true, message: "Connect request sent", id: requestId });
                } catch (error: any) {
                    console.error("Error creating connect request:", error);
                    return jsonResponse({ success: false, error: "Failed to create connect request" }, 500);
                }
            }

            // GET /api/connect-requests - List connect requests
            if (url.pathname === "/api/connect-requests" && request.method === "GET") {
                const authHeader = request.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const token = authHeader.substring(7);
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret");
                if (!payload) return jsonResponse({ success: false, error: "Invalid token" }, 401);

                if (!env.proveloce_db) return jsonResponse({ success: false, error: "Database not configured" }, 500);

                const role = (payload.role || "").toUpperCase();
                const viewType = url.searchParams.get("view") || "customer"; // customer or expert

                try {
                    let query: string;
                    let params: any[];

                    if (viewType === "expert" && role === "EXPERT") {
                        // Expert inbox
                        query = `
                            SELECT r.*, u.name as customer_name
                            FROM connect_requests r
                            JOIN users u ON u.id = r.customer_id
                            WHERE r.expert_id = ?
                            ORDER BY r.created_at DESC
                        `;
                        params = [payload.userId];
                    } else {
                        // Customer's own requests
                        query = `
                            SELECT r.*, u.name as expert_name
                            FROM connect_requests r
                            JOIN users u ON u.id = r.expert_id
                            WHERE r.customer_id = ?
                            ORDER BY r.created_at DESC
                        `;
                        params = [payload.userId];
                    }

                    const result = await env.proveloce_db.prepare(query).bind(...params).all();

                    return jsonResponse({
                        success: true,
                        data: { requests: result.results || [] }
                    });
                } catch (error: any) {
                    console.error("Error fetching connect requests:", error);
                    return jsonResponse({ success: false, error: "Failed to fetch connect requests" }, 500);
                }
            }

            // PATCH /api/connect-requests/:id - Accept/Reject request (expert only)
            const connectRequestMatch = url.pathname.match(/^\/api\/connect-requests\/([^\/]+)$/);
            if (connectRequestMatch && request.method === "PATCH") {
                const authHeader = request.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const token = authHeader.substring(7);
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret");
                if (!payload) return jsonResponse({ success: false, error: "Invalid token" }, 401);

                const requestId = connectRequestMatch[1];

                if (!env.proveloce_db) return jsonResponse({ success: false, error: "Database not configured" }, 500);

                try {
                    const body = await request.json() as { status: 'accepted' | 'rejected' };

                    if (!body.status || !['accepted', 'rejected'].includes(body.status)) {
                        return jsonResponse({ success: false, error: "Invalid status" }, 400);
                    }

                    // Verify expert owns the request
                    const request_data = await env.proveloce_db.prepare(`
                        SELECT * FROM connect_requests WHERE id = ? AND expert_id = ?
                    `).bind(requestId, payload.userId).first() as any;

                    if (!request_data) {
                        return jsonResponse({ success: false, error: "Request not found or unauthorized" }, 404);
                    }

                    // Update status
                    await env.proveloce_db.prepare(`
                        UPDATE connect_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
                    `).bind(body.status, requestId).run();

                    // If accepted, create session
                    if (body.status === 'accepted') {
                        const sessionId = crypto.randomUUID();
                        const roomId = `room-${sessionId.substring(0, 8)}`;

                        await env.proveloce_db.prepare(`
                            INSERT INTO sessions (id, request_id, expert_id, customer_id, scheduled_date, scheduled_slot_label, status, room_id)
                            VALUES (?, ?, ?, ?, ?, ?, 'scheduled', ?)
                        `).bind(
                            sessionId,
                            requestId,
                            request_data.expert_id,
                            request_data.customer_id,
                            request_data.requested_date,
                            request_data.requested_slot_label,
                            roomId
                        ).run();

                        // Notify customer
                        await createNotification(
                            env,
                            request_data.customer_id,
                            'SUCCESS',
                            'Connect Request Accepted',
                            'Your connect request has been accepted. A session is scheduled.',
                            '/customer/my-requests'
                        );
                    } else {
                        // Notify customer of rejection
                        await createNotification(
                            env,
                            request_data.customer_id,
                            'WARNING',
                            'Connect Request Rejected',
                            'Your connect request was not accepted.',
                            '/customer/my-requests'
                        );
                    }

                    return jsonResponse({ success: true, message: `Request ${body.status}` });
                } catch (error: any) {
                    console.error("Error updating connect request:", error);
                    return jsonResponse({ success: false, error: "Failed to update connect request" }, 500);
                }
            }

            // =====================================================
            // Expert Connect - Sessions
            // =====================================================

            // GET /api/sessions - List sessions
            if (url.pathname === "/api/sessions" && request.method === "GET") {
                const authHeader = request.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const token = authHeader.substring(7);
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret");
                if (!payload) return jsonResponse({ success: false, error: "Invalid token" }, 401);

                if (!env.proveloce_db) return jsonResponse({ success: false, error: "Database not configured" }, 500);

                try {
                    const result = await env.proveloce_db.prepare(`
                        SELECT s.*, 
                               e.name as expert_name,
                               c.name as customer_name
                        FROM sessions s
                        JOIN users e ON e.id = s.expert_id
                        JOIN users c ON c.id = s.customer_id
                        WHERE s.expert_id = ? OR s.customer_id = ?
                        ORDER BY s.scheduled_date DESC
                    `).bind(payload.userId, payload.userId).all();

                    return jsonResponse({
                        success: true,
                        data: { sessions: result.results || [] }
                    });
                } catch (error: any) {
                    console.error("Error fetching sessions:", error);
                    return jsonResponse({ success: false, error: "Failed to fetch sessions" }, 500);
                }
            }

            // POST /api/sessions/:id/start - Start session
            const sessionStartMatch = url.pathname.match(/^\/api\/sessions\/([^\/]+)\/start$/);
            if (sessionStartMatch && request.method === "POST") {
                const authHeader = request.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const token = authHeader.substring(7);
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret");
                if (!payload) return jsonResponse({ success: false, error: "Invalid token" }, 401);

                const sessionId = sessionStartMatch[1];

                if (!env.proveloce_db) return jsonResponse({ success: false, error: "Database not configured" }, 500);

                try {
                    await env.proveloce_db.prepare(`
                        UPDATE sessions SET status = 'live', started_at = CURRENT_TIMESTAMP WHERE id = ?
                    `).bind(sessionId).run();

                    return jsonResponse({ success: true, message: "Session started" });
                } catch (error: any) {
                    console.error("Error starting session:", error);
                    return jsonResponse({ success: false, error: "Failed to start session" }, 500);
                }
            }

            // POST /api/sessions/:id/end - End session
            const sessionEndMatch = url.pathname.match(/^\/api\/sessions\/([^\/]+)\/end$/);
            if (sessionEndMatch && request.method === "POST") {
                const authHeader = request.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const token = authHeader.substring(7);
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret");
                if (!payload) return jsonResponse({ success: false, error: "Invalid token" }, 401);

                const sessionId = sessionEndMatch[1];

                if (!env.proveloce_db) return jsonResponse({ success: false, error: "Database not configured" }, 500);

                try {
                    await env.proveloce_db.prepare(`
                        UPDATE sessions 
                        SET status = 'ended', ended_at = CURRENT_TIMESTAMP,
                            duration_seconds = CAST((julianday(CURRENT_TIMESTAMP) - julianday(started_at)) * 86400 AS INTEGER)
                        WHERE id = ?
                    `).bind(sessionId).run();

                    return jsonResponse({ success: true, message: "Session ended" });
                } catch (error: any) {
                    console.error("Error ending session:", error);
                    return jsonResponse({ success: false, error: "Failed to end session" }, 500);
                }
            }

            // GET /api/sessions/:id/messages - Get session messages
            const sessionMessagesMatch = url.pathname.match(/^\/api\/sessions\/([^\/]+)\/messages$/);
            if (sessionMessagesMatch && request.method === "GET") {
                const authHeader = request.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const token = authHeader.substring(7);
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret");
                if (!payload) return jsonResponse({ success: false, error: "Invalid token" }, 401);

                const sessionId = sessionMessagesMatch[1];

                if (!env.proveloce_db) return jsonResponse({ success: false, error: "Database not configured" }, 500);

                try {
                    const result = await env.proveloce_db.prepare(`
                        SELECT m.*, u.name as sender_name
                        FROM session_messages m
                        JOIN users u ON u.id = m.sender_id
                        WHERE m.session_id = ?
                        ORDER BY m.created_at ASC
                    `).bind(sessionId).all();

                    return jsonResponse({
                        success: true,
                        data: { messages: result.results || [] }
                    });
                } catch (error: any) {
                    console.error("Error fetching messages:", error);
                    return jsonResponse({ success: false, error: "Failed to fetch messages" }, 500);
                }
            }

            // POST /api/sessions/:id/messages - Send message
            if (sessionMessagesMatch && request.method === "POST") {
                const authHeader = request.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const token = authHeader.substring(7);
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret");
                if (!payload) return jsonResponse({ success: false, error: "Invalid token" }, 401);

                const sessionId = sessionMessagesMatch[1];

                if (!env.proveloce_db) return jsonResponse({ success: false, error: "Database not configured" }, 500);

                try {
                    // Restriction: Only allow messaging if session is 'live' and user is a participant
                    const session = await env.proveloce_db.prepare(
                        "SELECT status, expert_id, customer_id FROM sessions WHERE id = ?"
                    ).bind(sessionId).first() as any;

                    if (!session) {
                        return jsonResponse({ success: false, error: "Session not found" }, 404);
                    }

                    if (session.status !== 'live') {
                        return jsonResponse({ success: false, error: "Messaging is only allowed during active (live) sessions" }, 403);
                    }

                    if (payload.userId !== session.expert_id && payload.userId !== session.customer_id) {
                        return jsonResponse({ success: false, error: "Unauthorized: You are not a participant in this session" }, 403);
                    }

                    const body = await request.json() as { content: string; attachmentUrl?: string };

                    if (!body.content && !body.attachmentUrl) {
                        return jsonResponse({ success: false, error: "Message content required" }, 400);
                    }

                    const messageId = crypto.randomUUID();

                    await env.proveloce_db.prepare(`
                        INSERT INTO session_messages (id, session_id, sender_id, content_text, attachment_url)
                        VALUES (?, ?, ?, ?, ?)
                    `).bind(
                        messageId,
                        sessionId,
                        payload.userId,
                        body.content || null,
                        body.attachmentUrl || null
                    ).run();

                    return jsonResponse({ success: true, message: "Message sent", id: messageId });
                } catch (error: any) {
                    console.error("Error sending message:", error);
                    return jsonResponse({ success: false, error: "Failed to send message" }, 500);
                }
            }

            // =====================================================
            // Direct Messaging System
            // =====================================================

            // GET /api/messages/conversations - List all conversations
            if (url.pathname === "/api/messages/conversations" && request.method === "GET") {
                const authHeader = request.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const token = authHeader.substring(7);
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret");
                if (!payload) return jsonResponse({ success: false, error: "Invalid token" }, 401);

                if (!env.proveloce_db) return jsonResponse({ success: false, error: "Database not configured" }, 500);

                try {
                    // Get unique conversations with last message
                    const conversations = await env.proveloce_db.prepare(`
                        SELECT 
                            CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END as other_user_id,
                            u.name as other_user_name,
                            u.profile_photo_url as other_user_avatar,
                            m.content as last_message,
                            m.created_at as last_message_at,
                            (SELECT COUNT(*) FROM user_messages um WHERE um.sender_id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END AND um.receiver_id = ? AND um.read_at IS NULL) as unread_count
                        FROM user_messages m
                        JOIN users u ON u.id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END
                        WHERE m.sender_id = ? OR m.receiver_id = ?
                        GROUP BY other_user_id
                        ORDER BY m.created_at DESC
                    `).bind(payload.userId, payload.userId, payload.userId, payload.userId, payload.userId, payload.userId).all();

                    return jsonResponse({
                        success: true,
                        data: { conversations: conversations.results || [] }
                    });
                } catch (error: any) {
                    console.error("Error fetching conversations:", error);
                    return jsonResponse({ success: false, error: "Failed to fetch conversations" }, 500);
                }
            }

            // GET /api/messages/:userId - Get messages with a specific user
            const messagesMatch = url.pathname.match(/^\/api\/messages\/([^\/]+)$/);
            if (messagesMatch && request.method === "GET") {
                const authHeader = request.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const token = authHeader.substring(7);
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret");
                if (!payload) return jsonResponse({ success: false, error: "Invalid token" }, 401);

                const otherUserId = messagesMatch[1];

                if (!env.proveloce_db) return jsonResponse({ success: false, error: "Database not configured" }, 500);

                try {
                    // Get messages between the two users
                    const messages = await env.proveloce_db.prepare(`
                        SELECT m.*, u.name as sender_name
                        FROM user_messages m
                        JOIN users u ON u.id = m.sender_id
                        WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
                        ORDER BY m.created_at ASC
                    `).bind(payload.userId, otherUserId, otherUserId, payload.userId).all();

                    // Mark messages as read
                    await env.proveloce_db.prepare(`
                        UPDATE user_messages SET read_at = CURRENT_TIMESTAMP
                        WHERE sender_id = ? AND receiver_id = ? AND read_at IS NULL
                    `).bind(otherUserId, payload.userId).run();

                    // Get other user info
                    const otherUser = await env.proveloce_db.prepare(
                        "SELECT id, name, profile_photo_url FROM users WHERE id = ?"
                    ).bind(otherUserId).first();

                    return jsonResponse({
                        success: true,
                        data: {
                            messages: messages.results || [],
                            otherUser: otherUser || null
                        }
                    });
                } catch (error: any) {
                    console.error("Error fetching messages:", error);
                    return jsonResponse({ success: false, error: "Failed to fetch messages" }, 500);
                }
            }

            // POST /api/messages/:userId - Send a message to a user
            if (messagesMatch && request.method === "POST") {
                const authHeader = request.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const token = authHeader.substring(7);
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret");
                if (!payload) return jsonResponse({ success: false, error: "Invalid token" }, 401);

                const receiverId = messagesMatch[1];

                if (!env.proveloce_db) return jsonResponse({ success: false, error: "Database not configured" }, 500);

                try {
                    // Restriction: Only allow messaging if there is an active (live) session between these users
                    const activeSession = await env.proveloce_db.prepare(`
                        SELECT id FROM sessions 
                        WHERE status = 'live' 
                        AND ((expert_id = ? AND customer_id = ?) OR (expert_id = ? AND customer_id = ?))
                    `).bind(payload.userId, receiverId, receiverId, payload.userId).first();

                    if (!activeSession) {
                        return jsonResponse({
                            success: false,
                            error: "Messaging is restricted: You can only message during an active session with this user."
                        }, 403);
                    }

                    const body = await request.json() as { content: string };

                    if (!body.content || body.content.trim() === "") {
                        return jsonResponse({ success: false, error: "Message content is required" }, 400);
                    }

                    const messageId = crypto.randomUUID();

                    await env.proveloce_db.prepare(`
                        INSERT INTO user_messages (id, sender_id, receiver_id, content)
                        VALUES (?, ?, ?, ?)
                    `).bind(messageId, payload.userId, receiverId, body.content.trim()).run();

                    // Notify receiver
                    await createNotification(
                        env,
                        receiverId,
                        'INFO',
                        'New Message',
                        'You have received a new message',
                        '/messages'
                    );

                    return jsonResponse({
                        success: true,
                        message: "Message sent",
                        data: { id: messageId }
                    });
                } catch (error: any) {
                    console.error("Error sending message:", error);
                    return jsonResponse({ success: false, error: "Failed to send message" }, 500);
                }
            }

            // GET /api/messages/users/search - Search users to message
            if (url.pathname === "/api/messages/users/search" && request.method === "GET") {
                const authHeader = request.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const token = authHeader.substring(7);
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret");
                if (!payload) return jsonResponse({ success: false, error: "Invalid token" }, 401);

                if (!env.proveloce_db) return jsonResponse({ success: false, error: "Database not configured" }, 500);

                const query = url.searchParams.get("q") || "";

                try {
                    const users = await env.proveloce_db.prepare(`
                        SELECT id, name, email, role, profile_photo_url
                        FROM users
                        WHERE id != ? AND (name LIKE ? OR email LIKE ?)
                        LIMIT 20
                    `).bind(payload.userId, `%${query}%`, `%${query}%`).all();

                    return jsonResponse({
                        success: true,
                        data: { users: users.results || [] }
                    });
                } catch (error: any) {
                    console.error("Error searching users:", error);
                    return jsonResponse({ success: false, error: "Failed to search users" }, 500);
                }
            }

            // =====================================================
            // Admin - User Detail View with History
            // =====================================================

            // GET /api/admin/users/:id - Get user detail with history (admin/superadmin only)
            const adminUserDetailMatch = url.pathname.match(/^\/api\/admin\/users\/([^\/]+)$/);
            if (adminUserDetailMatch && request.method === "GET") {
                const authHeader = request.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
                }

                const token = authHeader.substring(7);
                const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || "default-secret");
                if (!payload) return jsonResponse({ success: false, error: "Invalid token" }, 401);

                const role = (payload.role || "").toUpperCase();
                if (!["ADMIN", "SUPERADMIN"].includes(role)) {
                    return jsonResponse({ success: false, error: "Access denied" }, 403);
                }

                const userId = adminUserDetailMatch[1];

                if (!env.proveloce_db) return jsonResponse({ success: false, error: "Database not configured" }, 500);

                try {
                    // Get user profile (public data only, no private messages)
                    const user = await env.proveloce_db.prepare(`
                        SELECT id, name, email, phone, role, status, profile_photo_url, created_at, updated_at
                        FROM users WHERE id = ?
                    `).bind(userId).first();

                    if (!user) {
                        return jsonResponse({ success: false, error: "User not found" }, 404);
                    }

                    // Get user profile details
                    const profile = await env.proveloce_db.prepare(
                        "SELECT * FROM user_profiles WHERE user_id = ?"
                    ).bind(userId).first();

                    // Get connect requests (bookings)
                    const connectRequests = await env.proveloce_db.prepare(`
                        SELECT cr.*, 
                               e.name as expert_name,
                               c.name as customer_name
                        FROM connect_requests cr
                        LEFT JOIN users e ON e.id = cr.expert_id
                        LEFT JOIN users c ON c.id = cr.customer_id
                        WHERE cr.customer_id = ? OR cr.expert_id = ?
                        ORDER BY cr.created_at DESC
                        LIMIT 50
                    `).bind(userId, userId).all();

                    // Get session history (meetings)
                    const sessions = await env.proveloce_db.prepare(`
                        SELECT s.*,
                               e.name as expert_name,
                               c.name as customer_name
                        FROM sessions s
                        LEFT JOIN users e ON e.id = s.expert_id
                        LEFT JOIN users c ON c.id = s.customer_id
                        WHERE s.expert_id = ? OR s.customer_id = ?
                        ORDER BY s.scheduled_date DESC
                        LIMIT 50
                    `).bind(userId, userId).all();

                    // Get expert application (if exists)
                    const expertApplication = await env.proveloce_db.prepare(
                        "SELECT * FROM expert_applications WHERE user_id = ?"
                    ).bind(userId).first();

                    // NOTE: Private messages are intentionally excluded for privacy

                    return jsonResponse({
                        success: true,
                        data: {
                            user,
                            profile: profile || null,
                            bookings: connectRequests.results || [],
                            sessions: sessions.results || [],
                            expertApplication: expertApplication || null
                        }
                    });
                } catch (error: any) {
                    console.error("Error fetching user detail:", error);
                    return jsonResponse({ success: false, error: "Failed to fetch user detail" }, 500);
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
