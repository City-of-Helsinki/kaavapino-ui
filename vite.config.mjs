import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '') //Load .env variables before Vite

  if (mode === 'test') {
    env.UNIT_TEST = 'true';
  }

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
      force: true,
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
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use '@/globals' as *;` //import global styles to all scss files
        },
      },
    },
    build: {
      outDir: 'build', // default is "dist"; set to "build" to match Dockerfile
      emptyOutDir: true, // clean the folder before building
    },
    define: { //Mofies default Vite environment variables to use react app environment variables
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env.REACT_APP_API_TOKEN': JSON.stringify(env.REACT_APP_API_TOKEN || ''),
      'process.env.REACT_APP_BASE_URL': JSON.stringify(env.REACT_APP_BASE_URL || ''),
      'process.env.REACT_APP_OPENID_ENDPOINT': JSON.stringify(env.REACT_APP_OPENID_ENDPOINT || ''),
      'process.env.REACT_APP_OPENID_CONNECT_CLIENT_ID': JSON.stringify(env.REACT_APP_OPENID_CONNECT_CLIENT_ID || ''),
      'process.env.REACT_APP_OPENID_AUDIENCE': JSON.stringify(env.REACT_APP_OPENID_AUDIENCE || ''),
      'process.env.UNIT_TEST': JSON.stringify(env.UNIT_TEST === 'true'),
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
      environment: 'jsdom',
      setupFiles: './src/setupTests.js',
      coverage: {
        reporter: ['text', 'json', 'lcov']
      }
    }
  }
})