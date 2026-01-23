import { renderToCanvas } from './preview/render';
import { defineAureliaStory } from './preview/helpers';

export { renderToCanvas };
export const render = renderToCanvas;
export { defineAureliaStory };
export type {
  AureliaRenderer,
  AureliaStoryResult,
  AureliaArgsStoryFn,
  AureliaRenderContext,
  AureliaStoryContext,
  AureliaParameters,
  AureliaStoryParameters
} from './preview/types';

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
