import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
  test: {
    globals: true,
    setupFiles: ['client/src/__tests__/setup.ts'],
    environmentMatchGlobs: [
      ['client/**', 'jsdom'],
      ['server/**', 'node'],
    ],
  },
});
