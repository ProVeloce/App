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
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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
                        env.JWT_SECRET || "default-secret",
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
                const payload = await verifyJWT(token, env.JWT_SECRET || "default-secret");

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
                const payload = await verifyJWT(token, env.JWT_SECRET || "default-secret");

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
