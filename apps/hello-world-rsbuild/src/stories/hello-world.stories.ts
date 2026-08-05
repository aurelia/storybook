import type { Meta, StoryObj } from '@aurelia/storybook';
import { defineAureliaStory } from '@aurelia/storybook';
import { expect, fn, userEvent, within } from 'storybook/test';
import { HelloWorld } from '../hello-world';

type HelloWorldArgs = {
  message?: string;
  onIncrement?: (value: number) => void;
};

const meta = {
  title: 'Example/HelloWorld',
  component: HelloWorld,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    message: { control: 'text' },
    onIncrement: { action: 'increment' },
  },
} satisfies Meta<HelloWorldArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultHelloWorld = {
  args: {
    message: 'Hello from Aurelia Storybook',
    onIncrement: fn(),
  },
} satisfies Story;

export const InteractiveHelloWorld = {
  args: {
    message: 'Try clicking the button!',
    onIncrement: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Increment' });
    await userEvent.click(button);
    await userEvent.click(button);
    await userEvent.click(button);
    await expect(args.onIncrement).toHaveBeenCalledTimes(3);
    await expect(args.onIncrement).toHaveBeenNthCalledWith(3, 3);
  },
} satisfies Story;

export const NoArgs = {} satisfies Story;

export const WithCustomTemplate = {
  render: (args) =>
    defineAureliaStory({
      template:
        '<hello-world message.bind="message">Custom slot content</hello-world>',
      props: args,
    }),
  args: {
    message: 'This is a custom message',
  },
} satisfies Story;
