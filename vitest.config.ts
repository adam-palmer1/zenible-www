import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom for browser-like environment
    environment: 'jsdom',

    // Global setup
    globals: true,

    // Setup files to run before each test file
    setupFiles: ['./src/test/setup.ts'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.config.js',
        '**/*.config.ts',
        '**/dist/**',
      ],
      // Coverage thresholds (goals from plan)
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },

    // Include test files
    include: ['**/*.{test,spec}.{js,jsx,ts,tsx}'],

    // Exclude patterns
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
