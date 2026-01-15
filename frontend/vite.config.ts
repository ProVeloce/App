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
    // Pre-bundle recharts to avoid TDZ (Temporal Dead Zone) issues
    optimizeDeps: {
        include: [
            'recharts',
            'recharts/lib/component/ResponsiveContainer',
            'recharts/lib/chart/LineChart',
            'recharts/lib/chart/BarChart',
            'recharts/lib/chart/PieChart',
        ],
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
        chunkSizeWarningLimit: 500,
        rollupOptions: {
            output: {
                manualChunks: {
                    // Use object syntax instead of function to avoid chunking issues
                    'vendor-react': ['react', 'react-dom'],
                    'vendor-router': ['react-router-dom'],
                    'vendor-ui': ['lucide-react'],
                    // Keep recharts and d3 together as a single chunk
                    'vendor-charts': [
                        'recharts',
                        'd3-scale',
                        'd3-shape',
                        'd3-path',
                        'd3-interpolate',
                        'd3-color',
                        'd3-format',
                        'd3-time',
                        'd3-time-format',
                        'd3-array',
                    ],
                },
            },
        },
    },
});
