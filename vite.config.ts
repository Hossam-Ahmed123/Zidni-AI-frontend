import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';

export default defineConfig(({ mode }) => {
  const API_PROXY_TARGET =
    mode === 'development'
      ? 'http://app-test.72.61.18.248.nip.io'
      : 'http://localhost:8080';

  return ({
  plugins: [vue(), vuetify({ autoImport: true })],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      primevue: fileURLToPath(new URL('./src/vendor/primevue/index.ts', import.meta.url)),
      'primevue/': fileURLToPath(new URL('./src/vendor/primevue/', import.meta.url)),
      'primeicons/': fileURLToPath(new URL('./src/vendor/primeicons/', import.meta.url))
    }
  },

  define: {
    global: 'globalThis'
  },

  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      },
      sourcemap: false
    }
  },

    server: {
    host: true,
    port: 5174,
    allowedHosts: [
      '127.0.0.1.nip.io',
      'app.127.0.0.1.nip.io',
      'app-test.127.0.0.1.nip.io',
      'app-test.72.61.18.248.nip.io',
      'mrhossam.72.61.18.248.nip.io'
    ],
      proxy: {
      '/api': {
        target: API_PROXY_TARGET,
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: {
          '.127.0.0.1.nip.io': '.127.0.0.1.nip.io'
        },
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            const host = req.headers.host;
            if (host) {
              proxyReq.setHeader('X-Forwarded-Host', host);
              proxyReq.setHeader('X-Forwarded-Proto', 'http');
            }
            proxyReq.setHeader('Origin', API_PROXY_TARGET);
          });
        }
      },
      '/static': {
        target: API_PROXY_TARGET,
        changeOrigin: true,
        secure: false
      },
      '/ws': {
        target: API_PROXY_TARGET,
        changeOrigin: true,
        ws: true,
        secure: false
      }
      }
    },

    hmr: {
      host: 'app-test.127.0.0.1.nip.io',
      protocol: 'ws'
    }
  });
});
