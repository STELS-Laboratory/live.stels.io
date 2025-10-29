import path from "path"
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
  },
  worker: {
    format: 'es',
  },
  plugins: [
    tailwindcss(), 
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['logo.svg', 'schemas/*.json', 'android/**/*.png', 'ios/**/*.png', 'windows11/**/*.png'],
      manifest: {
        name: 'STELS Web 5',
        short_name: 'STELS',
        description: 'Distributed Web OS for autonomous AI web agents. Professional laboratory for Web 5 developers built on heterogeneous networks.',
        theme_color: '#f59e0b',
        background_color: '#33312f',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        categories: ['web', 'webos', 'webtocken', 'webagent', 'webai', 'productivity', 'utilities'],
        iarc_rating_id: 'e84b072d-71b3-4d3e-86ae-31a8ce4e53b7',
        prefer_related_applications: false,
        icons: [
          {
            src: '/android/android-launchericon-48-48.png',
            sizes: '48x48',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/android/android-launchericon-72-72.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/android/android-launchericon-96-96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/android/android-launchericon-144-144.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/android/android-launchericon-192-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/android/android-launchericon-512-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,txt,woff2,json}'],
        globIgnores: [
          '**/assets/*worker*.js', // Exclude Monaco Editor workers from precache
        ],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MB limit for large assets
        runtimeCaching: [
          {
            urlPattern: /^\/schemas\/.*\.json$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'schemas-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 365 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /.*\.worker.*\.js$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'monaco-workers-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/live\.stels\.io\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'stels-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 365 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 365 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1MB
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug'],
      },
    },
    rollupOptions: {
      external: (id) => {
        // Exclude CCXT test files
        if (id.includes('/ccxt/ts/src/test/')) return true;
        return false;
      },
      output: {
        manualChunks: (id) => {
          // CodeMirror 6 (much smaller than Monaco)
          if (id.includes('@codemirror')) {
            return 'codemirror';
          }
          // React and related libraries
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/react-is') ||
              id.includes('node_modules/scheduler')) {
            return 'react-vendor';
          }
          // CCXT library
          if (id.includes('node_modules') && id.includes('/ccxt/')) {
            return 'ccxt-vendor';
          }
          // Other large UI libraries
          if (id.includes('node_modules/@radix-ui') ||
              id.includes('node_modules/framer-motion') ||
              id.includes('node_modules/reactflow')) {
            return 'ui-vendor';
          }
          // Crypto libraries
          if (id.includes('node_modules/@noble') ||
              id.includes('node_modules/elliptic') ||
              id.includes('node_modules/bs58')) {
            return 'crypto-vendor';
          }
        }
      }
    }
  }
});