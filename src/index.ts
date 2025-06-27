import type { StorybookConfig } from 'storybook/internal/types';
import { renderToCanvas } from './preview/render';

export { renderToCanvas };
export const render = renderToCanvas;

// Define the framework
export const framework = {
  name: '@aurelia/storybook',
  options: {}
};

// Framework configuration for Storybook
export const frameworkOptions = {
  builder: {
    name: '@storybook/builder-vite',
    options: {}
  }
};

// Export a complete framework configuration
export const aureliaFramework = {
  name: '@aurelia/storybook',
  options: {},
  builder: '@storybook/builder-vite'
};

// Provide external dependencies configuration
export const externals = {
  'react': 'React',
  'react-dom': 'ReactDOM'
};
