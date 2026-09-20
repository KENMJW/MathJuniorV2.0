import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'fs';
import path from 'path';

function syncAssetsPlugin() {
  return {
    name: 'sync-assets',
    buildStart() {
      const dirs = ['assets/questions', 'assets/concepts'];
      for (const relDir of dirs) {
        const srcDir = path.resolve(__dirname, relDir);
        const targetDir = path.resolve(__dirname, 'public', relDir);
        if (fs.existsSync(srcDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
          const files = fs.readdirSync(srcDir);
          for (const file of files) {
            const srcFile = path.join(srcDir, file);
            const targetFile = path.join(targetDir, file);
            if (fs.statSync(srcFile).isFile() && !file.startsWith('.')) {
              fs.copyFileSync(srcFile, targetFile);
            }
          }
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [
    syncAssetsPlugin(),
    react(),
    legacy({
      targets: ['defaults', 'not IE 11', 'Safari >= 14', 'iOS >= 14'],
      modernTargets: ['Safari >= 14', 'iOS >= 14', 'Chrome >= 88', 'Edge >= 88', 'Firefox >= 78'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt'],
      manifest: {
        name: '全科核心素养提分系统 - 初中数学',
        short_name: '数学提分',
        description: '全科核心素养提分系统 V2.0 初中数学模块',
        theme_color: '#0f172a',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,ico,png,svg,woff2,wasm,db}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        navigateFallback: null,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  worker: {
    format: 'es',
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'zustand'],
        },
      },
    },
  },
});
