import type { Meta, StoryObj } from '@aurelia/storybook';
import { defineAureliaStory } from '@aurelia/storybook';
import { expect, fn } from 'storybook/test';
import { HelloWorld } from '../hello-world';

type FeatureArgs = {
  message: string;
  accent: string;
  onIncrement?: (value: number) => void;
};

const meta = {
  title: 'Integration/FrameworkFeatures',
  component: HelloWorld,
  args: {
    message: 'Rendered without a custom render function',
    accent: '#7c3aed',
    onIncrement: fn(),
  },
  argTypes: {
    accent: { control: 'color' },
  },
} satisfies Meta<FeatureArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AutomaticComponentRender = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('Rendered without a custom render function')
    ).toBeVisible();
  },
} satisfies Story;

export const ComponentWithSlotContent = {
  render: (args) =>
    defineAureliaStory({
      Component: HelloWorld,
      innerHtml: '<strong>Projected through &lt;au-slot&gt;</strong>',
      props: args,
    }),
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('Projected through <au-slot>')
    ).toBeVisible();
  },
} satisfies Story;

export const LoaderGlobalsAndDecorator = {
  loaders: [
    async () => ({
      loadedMessage: 'Loader finished before the story rendered',
    }),
  ],
  decorators: [
    (Story) => {
      const result = Story();
      if (!result || typeof result !== 'object') {
        return result;
      }
      return {
        ...result,
        template:
          '<section aria-label="Decorated story" style="padding: 24px; border: 2px solid #7c3aed; border-radius: 16px">' +
          (result.template ?? '') +
          '</section>',
      };
    },
  ],
  render: (args, { globals, loaded }) =>
    defineAureliaStory({
      template:
        '<div>' +
        '<h2 style="color: ${accent}">${message}</h2>' +
        '<p>${loadedMessage}</p>' +
        '<p>Toolbar theme: ${theme}</p>' +
        '</div>',
      props: {
        ...args,
        loadedMessage: loaded.loadedMessage,
        theme: globals.theme,
      },
    }),
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('Decorated story')).toBeVisible();
    await expect(
      canvas.getByText('Loader finished before the story rendered')
    ).toBeVisible();
    await expect(canvas.getByText('Toolbar theme: light')).toBeVisible();
  },
} satisfies Story;

export const MountedFromPlayFunction = {
  play: async ({ mount }) => {
    const canvas = await mount({
      Component: HelloWorld,
      props: {
        message: 'Mounted from the play function',
        onIncrement: fn(),
      },
    });
    await expect(
      canvas.getByText('Mounted from the play function')
    ).toBeVisible();
  },
} satisfies Story;
