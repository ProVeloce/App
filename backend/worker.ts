/**
 * Cloudflare Worker - Backend Proxy Router
 * Routes requests from backend.proveloce.com to Render backend
 */

export interface Env {
    // Environment bindings can be added here if needed
}

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const url = new URL(request.url);

        // Your Render backend base URL
        const RENDER_API = "https://app-0zrq.onrender.com";

        // Create new request with proper headers
        const modifiedRequest = new Request(RENDER_API + url.pathname + url.search, {
            method: request.method,
            headers: request.headers,
            body: request.body,
            redirect: 'manual', // Important: Handle redirects manually for OAuth
        });

        // Forward the request to Render backend
        const response = await fetch(modifiedRequest);

        // Clone response and modify headers if needed
        const modifiedResponse = new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
        });

        return modifiedResponse;
    },
};
