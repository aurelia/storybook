import { extractArgTypes, extractComponentDescription } from './preview/argtypes';

if (typeof window !== 'undefined') {
  (window as Window & { STORYBOOK_ENV?: string }).STORYBOOK_ENV = 'aurelia';
}

export { argTypesEnhancers } from './preview/argtypes';
export { defineAureliaStory } from './preview/helpers';
export { mount } from './preview/mount';
export { render, renderToCanvas, setup } from './preview/render';

export const parameters = {
  renderer: 'aurelia',
  docs: {
    story: { inline: true },
    extractArgTypes,
    extractComponentDescription,
  },
};
