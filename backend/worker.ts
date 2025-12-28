export default {
    async fetch(request: Request, env: any): Promise<Response> {
        const url = new URL(request.url);

        // CORS headers for all responses
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        };

        // Handle CORS preflight
        if (request.method === "OPTIONS") {
            return new Response(null, { headers: corsHeaders });
        }

        try {
            // =====================================================
            // Base Routes
            // =====================================================

            // Base test route
            if (url.pathname === "/api") {
                return Response.json(
                    { success: true, message: "ProVeloce API Active 🚀" },
                    { headers: corsHeaders }
                );
            }

            // Health check route
            if (url.pathname === "/health") {
                return Response.json(
                    { status: "ok", timestamp: new Date().toISOString() },
                    { headers: corsHeaders }
                );
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
                    return Response.json(
                        { success: false, error: "GOOGLE_CLIENT_ID not configured" },
                        { status: 500, headers: corsHeaders }
                    );
                }

                const googleURL = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri)}&response_type=code&scope=${encodeURIComponent(scope)}`;

                return Response.redirect(googleURL, 302);
            }

            // Step 2: Google Callback Handler
            if (url.pathname === "/api/auth/google/callback") {
                const code = url.searchParams.get("code");
                const error = url.searchParams.get("error");

                if (error) {
                    return Response.json(
                        { success: false, error: `Google Auth Error: ${error}` },
                        { status: 400, headers: corsHeaders }
                    );
                }

                if (!code) {
                    return Response.json(
                        { success: false, error: "No code provided" },
                        { status: 400, headers: corsHeaders }
                    );
                }

                // TODO: Exchange code for tokens and create/login user
                return Response.json(
                    {
                        success: true,
                        message: "Google Auth Callback Received ✔",
                        code
                    },
                    { headers: corsHeaders }
                );
            }

            // =====================================================
            // D1 Database Routes
            // =====================================================

            // Test DB connection
            if (url.pathname === "/api/db/test") {
                if (!env.DB) {
                    return Response.json(
                        { success: false, error: "D1 Database not bound. Check wrangler.toml" },
                        { status: 500, headers: corsHeaders }
                    );
                }
                const result = await env.DB.prepare("SELECT 1 as test").all();
                return Response.json(
                    { success: true, message: "D1 Database Connected ✔", result: result.results },
                    { headers: corsHeaders }
                );
            }

            // Get all users
            if (url.pathname === "/api/db/users" && request.method === "GET") {
                const result = await env.DB.prepare("SELECT id, name, email, role, status, created_at FROM users LIMIT 50").all();
                return Response.json(
                    { success: true, users: result.results },
                    { headers: corsHeaders }
                );
            }

            // Create user
            if (url.pathname === "/api/db/users" && request.method === "POST") {
                const body = await request.json() as any;
                const id = crypto.randomUUID();

                await env.DB.prepare(
                    "INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, ?)"
                ).bind(id, body.name, body.email, body.role || "customer").run();

                return Response.json(
                    { success: true, message: "User created", id },
                    { status: 201, headers: corsHeaders }
                );
            }

            // Get user by ID
            if (url.pathname.startsWith("/api/db/users/") && request.method === "GET") {
                const id = url.pathname.split("/").pop();
                const result = await env.DB.prepare(
                    "SELECT id, name, email, role, status, created_at FROM users WHERE id = ?"
                ).bind(id).first();

                if (!result) {
                    return Response.json(
                        { success: false, error: "User not found" },
                        { status: 404, headers: corsHeaders }
                    );
                }

                return Response.json(
                    { success: true, user: result },
                    { headers: corsHeaders }
                );
            }

            // =====================================================
            // Default Route
            // =====================================================

            return new Response("ProVeloce Cloudflare Backend Running ✔", {
                headers: { "Content-Type": "text/plain", ...corsHeaders }
            });

        } catch (error: any) {
            return Response.json(
                { success: false, error: error.message || "Internal Server Error" },
                { status: 500, headers: corsHeaders }
            );
        }
    }
}
