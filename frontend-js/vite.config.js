import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Load-balanced backend targets — Vite dev proxy round-robins across these.
// In production, replace with your actual Nginx/HAProxy upstream config.
const BACKEND_TARGETS = [
  'http://127.0.0.1:8000',
  'http://127.0.0.1:8001',
  'http://127.0.0.1:8002',
]

let rrIndex = 0
function nextTarget() {
  const t = BACKEND_TARGETS[rrIndex % BACKEND_TARGETS.length]
  rrIndex++
  return t
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: BACKEND_TARGETS[0],
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy) => {
          // Round-robin load balancing at the proxy level
          proxy.on('proxyReq', (proxyReq) => {
            const target = nextTarget()
            const url = new URL(target)
            proxyReq.host = url.host
          })
        },
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor'
          }
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3')) {
            return 'charts'
          }
        },
      },
    },
  },
})
