import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
            },
            '/uploads': {
                target: 'http://localhost:5000',
                changeOrigin: true,
            },
        },
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
        chunkSizeWarningLimit: 300,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    // Core React
                    if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
                        return 'vendor-react';
                    }
                    // Router
                    if (id.includes('node_modules/react-router')) {
                        return 'vendor-router';
                    }
                    // Charts
                    if (id.includes('node_modules/recharts') || id.includes('node_modules/d3')) {
                        return 'vendor-charts';
                    }
                    // UI libraries
                    if (id.includes('node_modules/framer-motion') || id.includes('node_modules/lucide-react')) {
                        return 'vendor-ui';
                    }
                },
            },
        },
    },
});
