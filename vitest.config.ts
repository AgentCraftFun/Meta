import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'node',
    include: ['**/__tests__/**/*.test.ts'],
    // Vitest picks up tsconfig.json automatically; no extra setup needed
    // for the pure-function tests in this repo.
  },
});
