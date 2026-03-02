import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Travel Route Planner',
        short_name: 'Route Planner',
        description: '가고 싶은 장소 리스트 + 최적 경로 + 대중교통/택시 시간·비용',
        start_url: '/',
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: '#0ea5e9',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: 'index.html',
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: []
      }
    })
  ],
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    proxy: {
      '/api/google': {
        target: 'https://maps.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/google/, '')
      },
      '/api/places': {
        target: 'https://places.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/places/, '')
      },
      '/api/routes': {
        target: 'https://routes.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/routes/, '')
      },
      '/api/naver': {
        target: 'https://maps.apigw.ntruss.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/naver/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('x-ncp-apigw-api-key-id', env.VITE_NAVER_CLIENT_ID || '')
            proxyReq.setHeader('x-ncp-apigw-api-key', env.VITE_NAVER_CLIENT_SECRET || '')
          })
        }
      }
    }
  }
  }
})
