import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Book and audio files are large and already static, so we let the
      // browser's normal HTTP cache handle them instead of forcing every
      // byte through the service worker's precache.
      includeAssets: ['favicon.svg', 'icon-180.png', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Strack — Gatsby Reading Music',
        short_name: 'Strack',
        description: 'Reading The Great Gatsby with scene-matched ambient music.',
        start_url: '/',
        display: 'standalone',
        background_color: '#16171d',
        theme_color: '#16171d',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Keep the precache limited to the app shell; audio/epub assets
        // are fetched normally rather than bundled into the service worker.
        globPatterns: ['**/*.{js,css,html,svg}'],
      },
    }),
  ],
})
