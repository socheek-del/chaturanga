import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  { ignores: ['**/dist/**', '**/.wrangler/**', '**/node_modules/**', '**/coverage/**'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['apps/*/web/**/*.{ts,tsx}', 'packages/board-ui/**/*.{ts,tsx}', 'packages/game-shell/**/*.{ts,tsx}', 'packages/ui/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    files: ['**/*.cjs'],
    languageOptions: { sourceType: 'commonjs', globals: globals.node },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  {
    files: ['**/scripts/**/*.mjs'],
    languageOptions: { globals: globals.node },
  },
  { ignores: ['**/dev-dist/**'] },
  {
    files: [
      'packages/makruk/src/**/*.ts',
      'packages/sittuyin/src/**/*.ts',
      'packages/xiangqi/src/**/*.ts',
      'packages/shogi/src/**/*.ts',
      'packages/rules-core/src/**/*.ts',
      'packages/ai-core/src/**/*.ts',
      'packages/sittuyin-ai/src/**/*.ts',
      'packages/xiangqi-ai/src/**/*.ts',
    ],
    ignores: ['packages/*/src/**/*.test.ts', 'packages/*/src/testing/**'],
    rules: {
      // Engine must stay pure: no DOM, network, or timers.
      'no-restricted-globals': ['error', 'window', 'document', 'fetch', 'localStorage', 'setTimeout', 'setInterval'],
    },
  },
);
