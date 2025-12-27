export default {
    async fetch(request: Request, env: any): Promise<Response> {
        const url = new URL(request.url);

        // CORS headers for all responses
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        };

        // Handle CORS preflight
        if (request.method === "OPTIONS") {
            return new Response(null, { headers: corsHeaders });
        }

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

        // Step 1: Google Login Redirect
        if (url.pathname === "/api/auth/google") {
            const redirect_uri = "https://backend.proveloce.com/api/auth/google/callback";
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

            return Response.json(
                {
                    success: true,
                    message: "Google Auth Callback Received ✔",
                    code
                },
                { headers: corsHeaders }
            );
        }

        // Default Route
        return new Response("ProVeloce Cloudflare Backend Running ✔", {
            headers: { "Content-Type": "text/plain", ...corsHeaders }
        });
    }
}
