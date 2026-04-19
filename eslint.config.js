import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['*.config.{js,ts}', 'tailwind.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      // Disable no-undef for TypeScript - tsc handles this much better and
      // knows about global types like RequestInit, HTMLElement, etc.
      'no-undef': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      // Regression guards — all of these have been completed at some point in
      // the review passes and we want to prevent them creeping back.
      //
      // 1. Keep raw console.* out of feature code. src/utils/logger.ts is the
      //    single legitimate user of console; everything else should go through it.
      'no-console': 'warn',
      // 2. Escape hatches we've been consciously avoiding.
      'no-eval': 'error',
      'no-implied-eval': 'error',
      // 3. Fragile / bug-prone patterns.
      'no-restricted-syntax': [
        'warn',
        {
          // Catches `.catch(() => {})` — always log or handle errors explicitly.
          selector: 'CallExpression[callee.property.name="catch"] > ArrowFunctionExpression[body.body.length=0]',
          message: 'Empty `.catch(() => {})` swallows errors silently. Log via logger or re-throw.',
        },
        {
          // Catches `.catch(() => null)` — lost-error pattern we fixed in Pass 1.
          selector: 'CallExpression[callee.property.name="catch"] > ArrowFunctionExpression > Literal[value=null]',
          message: '`.catch(() => null)` discards the error. Log via logger before returning a default.',
        },
      ],
    },
  },
  {
    // Tests can use console and any freely — don't slow us down.
    files: ['**/*.{test,spec}.{ts,tsx}'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    // The logger itself is the one legitimate user of console.
    files: ['src/utils/logger.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['src/contexts/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
