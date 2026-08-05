import preview from '../../.storybook/preview';
import { expect, fn, userEvent } from 'storybook/test';
import { HelloWorld } from '../hello-world';

const meta = preview.meta({
  title: 'Integration/CSFFactories',
  component: HelloWorld,
  args: {
    message: 'Created with preview.meta',
    onIncrement: fn(),
  },
});

export const FactoryStory = meta.story({
  play: async ({ args, canvas }) => {
    await expect(
      canvas.getByText(args.message ?? 'Created with preview.meta')
    ).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Increment' }));
    await expect(args.onIncrement).toHaveBeenCalledWith(1);
  },
});

export const ExtendedFactoryStory = FactoryStory.extend({
  args: {
    message: 'Extended from another factory story',
  },
});
