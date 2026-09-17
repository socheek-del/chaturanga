import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * xq-004: for now the site is only the design showcase awaiting owner approval. xq-005 adds the router, the
 * PWA, the family links and the site address.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5176 },
  preview: { port: 4176 },
  test: { include: ['src/**/*.test.{ts,tsx}'] },
});
