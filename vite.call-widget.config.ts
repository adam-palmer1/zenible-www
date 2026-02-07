import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Build configuration for the embeddable booking widget
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      '__ZENIBLE_API_URL__': JSON.stringify(env.VITE_API_BASE_URL || 'https://api.zenible.com/api/v1'),
    },
    build: {
      lib: {
        entry: path.resolve(__dirname, 'src/call-widget/index.tsx'),
        name: 'ZenibleBooking',
        fileName: () => 'zenible-booking.iife.js',
        formats: ['iife'],
      },
      outDir: 'public/call-widget',
      emptyOutDir: true,
      copyPublicDir: false,
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
          name: 'ZenibleBooking',
        },
      },
      // Inline CSS into JS for single-file distribution
      cssCodeSplit: false,
      // Minify for production (using esbuild, which is bundled with Vite)
      minify: mode === 'production' ? 'esbuild' : false,
    },
  }
})
