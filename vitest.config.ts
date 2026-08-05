import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['__tests__/**/*.test.ts'],
    environment: 'jsdom',
    globals: true,
    clearMocks: true,
    restoreMocks: true,
  },
});
