import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '') //Load .env variables before Vite

  return {
    plugins: [
      react(),
      svgr(),
    ],
    esbuild: {
      loader: 'jsx',
      include: /src\/.*\.[jt]sx?$/,
      exclude: []
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.js': 'jsx'
        }
      }
    },
    resolve: {
      alias: {
        process: 'process/browser',
        '@': path.resolve(__dirname, 'src'),
      },
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env.REACT_APP_API_TOKEN': JSON.stringify(env.REACT_APP_API_TOKEN || ''),
      'process.env.REACT_APP_BASE_URL': JSON.stringify(env.REACT_APP_BASE_URL || ''),
      'process.env.REACT_APP_OPENID_ENDPOINT': JSON.stringify(env.REACT_APP_OPENID_ENDPOINT || ''),
      'process.env.REACT_APP_OPENID_CONNECT_CLIENT_ID': JSON.stringify(env.REACT_APP_OPENID_CONNECT_CLIENT_ID || ''),
      'process.env.REACT_APP_OPENID_AUDIENCE': JSON.stringify(env.REACT_APP_OPENID_AUDIENCE || ''),
    },
    server: {
      port: 3000,
      proxy: {
        '/v1': 'http://localhost:8000',
      },
      fs: {
        strict: false
      }
    },
    test: {
      coverage: {
        reporter: ['text', 'json', 'lcov']
      }
    }
  }
})

