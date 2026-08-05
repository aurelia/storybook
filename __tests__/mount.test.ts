import { mount } from '../src/preview/mount';

function createContext(result: unknown = { template: '<p>Original</p>' }) {
  const originalStoryFn = vi.fn(() => result);
  const context = {
    args: { value: 'from args' },
    canvas: { getByText: vi.fn() },
    originalStoryFn,
    renderToCanvas: vi.fn(async () => undefined),
  };
  return { context, originalStoryFn };
}

describe('mount', () => {
  it('mounts a supplied story result and merges mount options', async () => {
    const { context } = createContext();
    const First = { register: vi.fn() };
    const Second = { register: vi.fn() };

    const canvas = await mount(context as never)(
      {
        template: '<p>${message}</p>',
        props: { message: 'Story value' },
        register: [First],
      },
      {
        props: { extra: true },
        register: [Second],
      }
    );

    expect(context.renderToCanvas).toHaveBeenCalledOnce();
    expect(context.originalStoryFn()).toEqual({
      template: '<p>${message}</p>',
      props: { message: 'Story value', extra: true },
      register: [First, Second],
      components: [],
      items: [],
    });
    expect(canvas).toBe(context.canvas);
  });

  it('accepts component and template shorthand', async () => {
    const { context } = createContext();
    const Component = class {};
    const mountStory = mount(context as never);

    await mountStory(Component);
    expect(context.originalStoryFn()).toMatchObject({ Component });

    await mountStory('<strong>Markup</strong>');
    expect(context.originalStoryFn()).toMatchObject({
      template: '<strong>Markup</strong>',
    });
  });

  it('uses the current story when called without an override', async () => {
    const original = { template: '<p>Original</p>' };
    const { context, originalStoryFn } = createContext(original);

    await mount(context as never)();

    expect(originalStoryFn).toHaveBeenCalledWith(context.args, context);
    expect(context.originalStoryFn()).toBe(original);
  });
});
