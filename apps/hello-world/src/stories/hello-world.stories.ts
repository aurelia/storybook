import { HelloWorld } from '../hello-world';
import { action } from '@storybook/addon-actions';
import { userEvent, within } from '@storybook/testing-library';

const meta = {
  title: 'Example/HelloWorld',
  component: HelloWorld,
  render: (args) => ({
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
    message: "Hello from Storybook!",
    onIncrement: action('increment')
  }
};

export const InteractiveHelloWorld = {
  args: {
    message: "Try clicking the button!",
    onIncrement: action('increment')
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
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
  render: (args) => ({
    template: `<hello-world message.bind="message">Click me!</hello-world>`
  }),
  args: {
    message: "This is a custom message"
  }
};
