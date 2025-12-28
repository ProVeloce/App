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
 * 
 * Alternatively:
 * 1. Go to Workers & Pages → "backend" Worker → Settings → Domains & Routes
 * 2. Ensure routes are NOT protected by Access
 * 
 * Without this, all requests will be intercepted by Zero Trust before reaching
 * this Worker, causing auth endpoints to fail.
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

/**
 * Handle CORS preflight requests
 */
function handleOptions(request: Request): Response {
    // Check if this is a CORS preflight request
    const origin = request.headers.get("Origin");

    if (origin === ALLOWED_ORIGIN) {
        return new Response(null, {
            status: 204,
            headers: corsHeaders,
        });
    }

    // For non-matching origins, still return 204 but without CORS headers
    return new Response(null, { status: 204 });
}

/**
 * Add CORS headers to any Response
 */
function addCorsHeaders(response: Response): Response {
    const newHeaders = new Headers(response.headers);

    for (const [key, value] of Object.entries(corsHeaders)) {
        newHeaders.set(key, value);
    }

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
    });
}

/**
 * Create a JSON response with CORS headers
 */
function jsonResponse(data: any, status: number = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
        },
    });
}

// =====================================================
// Main Worker Export
// =====================================================

export default {
    async fetch(request: Request, env: any): Promise<Response> {
        const url = new URL(request.url);

        // =====================================================
        // Handle CORS Preflight (OPTIONS) - MUST be first!
        // =====================================================
        if (request.method === "OPTIONS") {
            return handleOptions(request);
        }

        try {
            // =====================================================
            // Base Routes
            // =====================================================

            // Base test route
            if (url.pathname === "/api") {
                return jsonResponse({ success: true, message: "ProVeloce API Active 🚀" });
            }

            // Health check route
            if (url.pathname === "/health") {
                return jsonResponse({ status: "ok", timestamp: new Date().toISOString() });
            }

            // =====================================================
            // Auth Routes - Email/Password Login
            // =====================================================

            if (url.pathname === "/api/auth/login" && request.method === "POST") {
                try {
                    const body = await request.json() as { email?: string; password?: string };

                    if (!body.email || !body.password) {
                        return jsonResponse({ success: false, error: "Email and password are required" }, 400);
                    }

                    // TODO: Implement actual login logic with D1 database
                    // For now, return a placeholder response
                    return jsonResponse({
                        success: true,
                        message: "Login endpoint reached ✔",
                        note: "Implement actual authentication logic here"
                    });
                } catch (e) {
                    return jsonResponse({ success: false, error: "Invalid request body" }, 400);
                }
            }

            // =====================================================
            // Google OAuth Routes
            // =====================================================

            // Step 1: Google Login Redirect
            if (url.pathname === "/api/auth/google") {
                const redirect_uri = env.GOOGLE_CALLBACK_URL || "https://backend.proveloce.com/api/auth/google/callback";
                const client_id = env.GOOGLE_CLIENT_ID;
                const scope = "openid email profile";

                if (!client_id) {
                    return jsonResponse({ success: false, error: "GOOGLE_CLIENT_ID not configured" }, 500);
                }

                const googleURL = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri)}&response_type=code&scope=${encodeURIComponent(scope)}`;

                // For redirects, we need to add CORS headers manually
                return new Response(null, {
                    status: 302,
                    headers: {
                        "Location": googleURL,
                        ...corsHeaders,
                    },
                });
            }

            // Step 2: Google Callback Handler
            if (url.pathname === "/api/auth/google/callback") {
                const code = url.searchParams.get("code");
                const error = url.searchParams.get("error");

                if (error) {
                    return jsonResponse({ success: false, error: `Google Auth Error: ${error}` }, 400);
                }

                if (!code) {
                    return jsonResponse({ success: false, error: "No code provided" }, 400);
                }

                // TODO: Exchange code for tokens and create/login user
                return jsonResponse({
                    success: true,
                    message: "Google Auth Callback Received ✔",
                    code
                });
            }

            // =====================================================
            // D1 Database Routes
            // =====================================================

            // Test DB connection
            if (url.pathname === "/api/db/test") {
                if (!env.DB) {
                    return jsonResponse({ success: false, error: "D1 Database not bound. Check wrangler.toml" }, 500);
                }
                const result = await env.DB.prepare("SELECT 1 as test").all();
                return jsonResponse({ success: true, message: "D1 Database Connected ✔", result: result.results });
            }

            // Get all users
            if (url.pathname === "/api/db/users" && request.method === "GET") {
                if (!env.DB) {
                    return jsonResponse({ success: false, error: "D1 Database not bound" }, 500);
                }
                const result = await env.DB.prepare("SELECT id, name, email, role, status, created_at FROM users LIMIT 50").all();
                return jsonResponse({ success: true, users: result.results });
            }

            // Create user
            if (url.pathname === "/api/db/users" && request.method === "POST") {
                if (!env.DB) {
                    return jsonResponse({ success: false, error: "D1 Database not bound" }, 500);
                }
                const body = await request.json() as any;
                const id = crypto.randomUUID();

                await env.DB.prepare(
                    "INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, ?)"
                ).bind(id, body.name, body.email, body.role || "customer").run();

                return jsonResponse({ success: true, message: "User created", id }, 201);
            }

            // Get user by ID
            if (url.pathname.startsWith("/api/db/users/") && request.method === "GET") {
                if (!env.DB) {
                    return jsonResponse({ success: false, error: "D1 Database not bound" }, 500);
                }
                const id = url.pathname.split("/").pop();
                const result = await env.DB.prepare(
                    "SELECT id, name, email, role, status, created_at FROM users WHERE id = ?"
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
