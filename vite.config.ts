import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/resistance-sp-webshow/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './src'),
    },
  },
  worker: {
    format: 'es',
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    fs: {
      // Allow serving files from public directory
      strict: false,
    },
  },
  // Ensure WASM files are served with correct MIME type
  assetsInclude: ['**/*.wasm'],
  optimizeDeps: {
    exclude: ['@/workers'],
  },
});
