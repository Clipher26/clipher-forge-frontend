import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

export default defineConfig(({ mode }) => {
    // NOTE: The Gemini API key is NOT injected here anymore. It is served at
    // runtime from the backend's GET /api/config endpoint (single source of
    // truth in backend/.env). The frontend fetches it client-side via
    // frontend/config.ts so the key never ships in the bundle.
    loadEnv(mode, __dirname, '');
    return {
      build: {
        outDir: path.resolve(repoRoot, 'dist'),
        assetsDir: 'assets',
      },
      server: {
        port: 3000,
        strictPort: false,
        host: '0.0.0.0',
        allowedHosts: true,
        proxy: {
          '/api/': {
            target: 'http://127.0.0.1:3001',
            changeOrigin: true,
          }
        }
      },
      preview: {
        port: 3000,
        strictPort: false,
        host: '0.0.0.0',
        allowedHosts: true
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': __dirname,
        }
      }
    };
});
