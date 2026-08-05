import aurelia from '@aurelia/vite-plugin';
import { defineConfig } from 'vite';

const aureliaRuntimePackages = [
  'aurelia',
  '@aurelia/expression-parser',
  '@aurelia/kernel',
  '@aurelia/metadata',
  '@aurelia/platform',
  '@aurelia/platform-browser',
  '@aurelia/runtime',
  '@aurelia/runtime-html',
  '@aurelia/template-compiler',
];

export default defineConfig(({ mode }) => ({
  server: {
    open: !process.env.CI,
    port: 9000,
  },
  oxc: {
    target: 'es2022',
  },
  optimizeDeps: {
    exclude: aureliaRuntimePackages,
    include: [
      '@storybook/addon-a11y',
      '@storybook/addon-docs',
      '@storybook/addon-vitest',
      'storybook/internal/csf',
    ],
  },
  resolve: {
    dedupe: aureliaRuntimePackages,
  },
  plugins: [
    aurelia({
      useDev: mode !== 'production',
      hmr: mode !== 'test',
    }),
  ],
}));
