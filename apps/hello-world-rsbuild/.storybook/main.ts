import type { StorybookConfig } from 'storybook/internal/types';

const config: StorybookConfig = {
  stories: ['../src/stories/**/*.stories.@(ts|tsx|js|jsx|mdx)'],
  addons: [
  ],
  framework: {
    name: '@aurelia/storybook',
    options: {},
  },
  core: {
    builder: 'storybook-builder-rsbuild',
  },
};

export default config;
