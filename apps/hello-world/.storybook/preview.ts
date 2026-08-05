import { definePreview } from '@aurelia/storybook';
import addonA11y from '@storybook/addon-a11y';
import addonDocs from '@storybook/addon-docs';
import addonVitest from '@storybook/addon-vitest';

export default definePreview({
  addons: [addonA11y(), addonDocs(), addonVitest()],
  tags: ['autodocs'],
  initialGlobals: {
    theme: 'light',
  },
  globalTypes: {
    theme: {
      description: 'Theme passed to stories through Storybook globals',
      toolbar: {
        icon: 'paintbrush',
        items: ['light', 'dark'],
      },
    },
  },
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'error',
    },
  },
});
