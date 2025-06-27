import { HelloWorld } from '../hello-world';
import { fn } from '@storybook/test';
import { userEvent, within } from '@storybook/test';

const meta = {
  title: 'Example/HelloWorld',
  component: HelloWorld,
  render: () => ({
    template: `<hello-world message.bind="message" on-increment.bind="onIncrement"></hello-world>`,
  }),
  argTypes: {
    message: { control: 'text' },
    onIncrement: { action: 'increment' }
  }
};

export default meta;

export const DefaultHelloWorld = {
  args: {
    message: "Hello frof",
    onIncrement: fn()
  }
};

export const InteractiveHelloWorld = {
  args: {
    message: "fsdfdddsdsdsdsdddddfdddd",
    onIncrement: fn()
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    // Simulate three button clicks
    await userEvent.click(button);
    await userEvent.click(button);
    await userEvent.click(button);
  }
};

export const NoArgs = {
  render: () => ({
    template: `<hello-world></hello-world>`
  })
};

export const WithCustomTemplate = {
  render: () => ({
    template: `<hello-world message.bind="message">Click me!</hello-world>`
  }),
  args: {
    message: "This is a custom messageddd"
  }
};
