import type { StorybookConfig } from 'storybook/internal/types';
import { mergeConfig, type InlineConfig } from 'vite';

const config: StorybookConfig & { viteFinal?: (config: InlineConfig, options: { configType: string }) => InlineConfig | Promise<InlineConfig> } = {
  stories: ['../src/stories/**/*.stories.@(ts|tsx|js|jsx|mdx)'],
  addons: [
  ],
  framework: {
    name: '@aurelia/storybook',
    options: {},
  },
  core: {
    builder: '@storybook/builder-vite',
  },
  viteFinal: async (viteConfig) => {
    // Initialize optimizeDeps and exclude array
    if (!viteConfig.optimizeDeps) {
      viteConfig.optimizeDeps = {};
    }
    if (!viteConfig.optimizeDeps.exclude) {
      viteConfig.optimizeDeps.exclude = [];
    }
    
    // Exclude Aurelia dependencies from pre-bundling, but allow React for Storybook
    const excludeList = [
      '@aurelia/runtime-html'
    ];
    
    excludeList.forEach(dep => {
      if (viteConfig.optimizeDeps?.exclude && !viteConfig.optimizeDeps.exclude.includes(dep)) {
        viteConfig.optimizeDeps.exclude.push(dep);
      }
    });

    return mergeConfig(viteConfig, {
      define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      },
      // Allow React to be bundled for Storybook's theming system
      resolve: {
        alias: {
          // Ensure React is properly resolved
        }
      }
    });
  },
};

export default config;
