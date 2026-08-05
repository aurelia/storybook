import { fileURLToPath } from 'node:url';
import aurelia from '@aurelia/vite-plugin';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [aurelia({ useDev: true, hmr: false })],
  test: {
    environment: 'jsdom',
    watch: false,
    root: fileURLToPath(new URL('./', import.meta.url)),
    setupFiles: ['./test/setup.ts'],
  },
});
