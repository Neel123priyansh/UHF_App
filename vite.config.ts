import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), VitePWA({
    registerType: 'autoUpdate',
      includeAssets: ['robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'My React PWA',
        short_name: 'Student Verification',
        description: 'A sample React PWA',
        start_url: '/',
        display: 'standalone',
        theme_color: '#0f172a',
        icons: [
          { src: '/public/assets/icons/Logo_192.png', sizes: '192x192', type: 'image/png' },
          { src: '/public/assets/icons/Logo_512.png', sizes: '512x512', type: 'image/png' },
          // For iOS maskable
          { src: '/public/assets/icons/Logo_512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable any' }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024, // ✅ increase to 6 MiB
      },
  })],
})
