import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // 로컬 dev에서 /api 요청을 프록시할 백엔드.
  // 기본은 로컬 Spring(8080), 원격 dev 서버를 쓰려면 VITE_DEV_PROXY_TARGET으로 지정.
  const proxyTarget = env.VITE_DEV_PROXY_TARGET || 'http://localhost:8080'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          cookieDomainRewrite: 'localhost',
          configure(proxy) {
            proxy.on('proxyReq', (proxyRequest) => {
              // The browser talks to Vite on the same origin. Do not forward its
              // localhost Origin to the remote API's CORS filter.
              proxyRequest.removeHeader('origin')
            })
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      css: true,
      restoreMocks: true,
    },
  }
})
