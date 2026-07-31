import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Some host-mounted root files (Dockerfile, .dockerignore) occasionally leak
// into Vite's module graph and crash vite:import-analysis because they aren't
// JS. Claim those ids and return an empty ESM stub so the parser never sees
// the raw contents.
const stubNonJsRootFiles = () => ({
  name: 'stub-non-js-root-files',
  enforce: 'pre' as const,
  resolveId(source: string) {
    const base = source.split('?')[0].split('/').pop() ?? ''
    if (base === 'Dockerfile' || base === '.dockerignore') {
      return source
    }
    return undefined
  },
  load(id: string) {
    const base = id.split('?')[0].split('/').pop() ?? ''
    if (base === 'Dockerfile' || base === '.dockerignore') {
      return 'export default null'
    }
    return undefined
  },
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), stubNonJsRootFiles()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: env.VITE_HOST || 'localhost',
      port: parseInt(env.VITE_PORT) || 3000,
      strictPort: true,
      allowedHosts: ['app.zenible.com', 'demo.zenible.com', 'www.zenible.com', 'zenible.com'],
      watch: {
        ignored: [
          '**/Dockerfile',
          '**/.dockerignore',
          '**/dist/**',
          '**/playwright-report/**',
          '**/test-results/**',
          '**/playwright/**',
          '**/tests/**',
          '**/.claude/**',
          '**/docs/**',
          '**/*.md',
        ],
      },
    },
    build: {
      rollupOptions: {
        output: {
          // Group heavy third-party libs into dedicated vendor chunks so they
          // cache independently across deploys (vendor churn is rare; app code
          // changes often). Also avoids duplicating these libs across route chunks.
          manualChunks: (id: string) => {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('@radix-ui')) return 'vendor-radix';
            if (id.includes('@dnd-kit')) return 'vendor-dnd';
            if (id.includes('@tanstack/react-query')) return 'vendor-react-query';
            if (id.includes('react-router')) return 'vendor-react-router';
            if (id.includes('date-fns')) return 'vendor-date-fns';
            if (id.includes('lucide-react')) return 'vendor-lucide';
            if (id.includes('@heroicons/react')) return 'vendor-heroicons';
            if (id.includes('react-hook-form') || id.includes('@hookform/resolvers') || id.includes('zod')) return 'vendor-forms';
            if (id.includes('socket.io-client') || id.includes('engine.io-client')) return 'vendor-socketio';
            if (id.includes('dompurify')) return 'vendor-dompurify';
            if (id.includes('quill') || id.includes('react-quill')) return 'vendor-editor';
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('scheduler')) return 'vendor-react';
            return undefined;
          },
        },
      },
    },
  }
})
