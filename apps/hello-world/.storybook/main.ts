import type { StorybookConfig } from '@storybook/core-common';
import { mergeConfig } from 'vite';

const config: StorybookConfig & { viteFinal?: (config: any, options: any) => any } = {
  stories: ['../src/stories/**/*.stories.@(ts|tsx|js|jsx|mdx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions'
  ],
  framework: {
    name: '@aurelia/storybook',
    options: {},
  },
  core: {
    builder: '@storybook/builder-vite',
  },
  viteFinal: async (viteConfig) => {
    viteConfig.optimizeDeps = viteConfig.optimizeDeps || {};
    viteConfig.optimizeDeps.exclude = viteConfig.optimizeDeps.exclude || [];
    if (!viteConfig.optimizeDeps.exclude.includes('@aurelia/runtime-html')) {
      viteConfig.optimizeDeps.exclude.push('@aurelia/runtime-html');
    }
    return mergeConfig(viteConfig, {
      // ...any additional Vite configuration
    });
  },
};

export default config as any;
