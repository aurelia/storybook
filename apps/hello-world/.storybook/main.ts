import { defineMain } from '@aurelia/storybook/node';

export default defineMain({
  stories: ['../src/stories/**/*.@(mdx|stories.@(ts|tsx|js|jsx))'],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-vitest',
  ],
  framework: {
    name: '@aurelia/storybook',
    options: {},
  },
  core: {
    builder: '@storybook/builder-vite',
  },
});
