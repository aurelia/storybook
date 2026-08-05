import { defineMain } from '@aurelia/storybook/node';

export default defineMain({
  stories: ['../src/**/*.@(mdx|stories.@(ts|tsx|js|jsx))'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: {
    name: '@aurelia/storybook',
    options: {},
  },
  core: {
    builder: '@storybook/builder-webpack5',
  },
});
