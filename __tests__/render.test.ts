import type { RenderContext } from 'storybook/internal/types';
import { refs } from 'aurelia';
import {
  createComponentTemplate,
  normalizeStoryResult,
  render,
  renderToCanvas,
} from '../src/preview/render';
import type { AureliaRenderer, AureliaStoryResult } from '../src/preview/types';

const aureliaMocks = vi.hoisted(() => ({
  getDefinition: vi.fn(() => ({
    name: 'dummy-comp',
    bindables: { prop: { attribute: 'prop', name: 'prop' } } as Record<
      string,
      { attribute: string; name: string }
    >,
    key: 'au:ce:dummy-comp',
  })),
  tasksSettled: vi.fn(async () => false),
}));

vi.mock('aurelia', async (importOriginal) => {
  const actual = await importOriginal<typeof import('aurelia')>();
  return {
    ...actual,
    CustomElement: {
      ...actual.CustomElement,
      getDefinition: aureliaMocks.getDefinition,
    },
  };
});

vi.mock('@aurelia/runtime', () => ({
  tasksSettled: aureliaMocks.tasksSettled,
}));

function fakeApp(viewModel: Record<string, unknown> = {}) {
  return {
    start: vi.fn(async () => undefined),
    stop: vi.fn(async () => undefined),
    root: { controller: { viewModel } },
  };
}

function renderContext(
  storyFn: () => unknown,
  overrides: Record<string, unknown> = {}
): RenderContext<AureliaRenderer> {
  const id = (overrides.id as string | undefined) ?? 'test--story';
  const storyContext = {
    id,
    title: 'Test',
    name: 'Story',
    component: class DummyComponent {},
    args: {},
    parameters: {},
    globals: {},
    ...((overrides.storyContext as Record<string, unknown> | undefined) ?? {}),
  };

  return {
    id,
    title: 'Test',
    name: 'Story',
    storyFn,
    unboundStoryFn: vi.fn(),
    showMain: vi.fn(),
    showError: vi.fn(),
    showException: vi.fn(),
    forceRemount: false,
    storyContext,
    ...overrides,
  } as unknown as RenderContext<AureliaRenderer>;
}

describe('render', () => {
  it('requires a component when the default render function is used', () => {
    expect(() =>
      render(
        {},
        {
          id: 'test--story',
          title: 'Test',
          name: 'Story',
          component: undefined,
        } as never
      )
    ).toThrow(
      'Unable to render Test / Story: add a component to the default export or provide a story render function.'
    );
  });

  it('maps Storybook args to the annotated component', () => {
    const Component = class {};
    const args = { message: 'Hello' };
    expect(
      render(args, { id: 'test--story', component: Component } as never)
    ).toEqual({ Component, props: args });
  });
});

describe('normalizeStoryResult', () => {
  it('accepts markup shorthand', () => {
    expect(normalizeStoryResult('<p>Hello</p>')).toEqual({
      template: '<p>Hello</p>',
    });
  });

  it('rejects empty results', () => {
    expect(normalizeStoryResult(null)).toBeUndefined();
  });
});

describe('renderToCanvas', () => {
  let canvas: HTMLElement;

  beforeEach(() => {
    canvas = document.createElement('div');
    aureliaMocks.tasksSettled.mockClear();
  });

  it('shows a useful error when a story returns nothing', async () => {
    const context = renderContext(() => null);
    const cleanup = await renderToCanvas(context, canvas);

    expect(context.showError).toHaveBeenCalledWith({
      title: 'Nothing was returned by Test / Story.',
      description:
        'Return Aurelia markup, a custom element, or an object with a template or Component.',
    });
    expect(context.showMain).not.toHaveBeenCalled();
    expect(cleanup).toBeTypeOf('function');
  });

  it('shows a useful error when a result has no template or component', async () => {
    const context = renderContext(() => ({}), {
      storyContext: { component: undefined },
    });
    await renderToCanvas(context, canvas);

    expect(context.showError).toHaveBeenCalledWith({
      title: 'No Aurelia template or component was provided by Test / Story.',
      description:
        'Add a component to the default export, or return an object with template or Component.',
    });
  });

  it('starts, settles, displays, and cleans up a story', async () => {
    const app = fakeApp();
    const bootstrap = vi.fn(() => app);
    const context = renderContext(() => ({
      template: '<p>${message}</p>',
      props: { message: 'Story value' },
    }));

    const cleanup = await renderToCanvas(context, canvas, bootstrap);

    expect(app.start).toHaveBeenCalledOnce();
    expect(aureliaMocks.tasksSettled).toHaveBeenCalledOnce();
    expect(context.showMain).toHaveBeenCalledOnce();
    await cleanup();
    expect(app.stop).toHaveBeenCalledWith(true);
  });

  it('releases Aurelia controller ownership before reusing a canvas host', async () => {
    const app = fakeApp();
    const cleanup = await renderToCanvas(
      renderContext(() => '<p>Hello</p>'),
      canvas,
      vi.fn(() => app)
    );

    refs.set(canvas, 'au:resource:custom-element', {} as never);
    expect(refs.get(canvas, 'au:resource:custom-element')).not.toBeNull();

    await cleanup();

    expect(refs.get(canvas, 'au:resource:custom-element')).toBeNull();
  });

  it('updates args without remounting and clears removed values', async () => {
    const viewModel: Record<string, unknown> = {};
    const app = fakeApp(viewModel);
    const bootstrap = vi.fn(() => app);
    const firstStory: AureliaStoryResult = {
      template: '<p>${message}</p>',
      props: { message: 'First', removed: 'old' },
    };
    const context = renderContext(() => firstStory);

    await renderToCanvas(context, canvas, bootstrap);
    context.storyFn = vi.fn(() => ({
      template: '<p>${message}</p>',
      props: { message: 'Second' },
    }));
    await renderToCanvas(context, canvas, bootstrap);

    expect(bootstrap).toHaveBeenCalledOnce();
    expect(viewModel).toEqual({ message: 'Second', removed: undefined });
    expect(aureliaMocks.tasksSettled).toHaveBeenCalledTimes(2);
  });

  it('gives story props precedence over args and legacy parameter args', async () => {
    const app = fakeApp();
    const bootstrap = vi.fn(() => app);
    const context = renderContext(
      () => ({ template: '<p></p>', props: { value: 'story' } }),
      {
        storyContext: {
          component: undefined,
          parameters: { args: { value: 'parameter', first: true } },
          args: { value: 'args', second: true },
        },
      }
    );

    await renderToCanvas(context, canvas, bootstrap);

    expect(bootstrap).toHaveBeenCalledWith(
      expect.anything(),
      { value: 'story', first: true, second: true },
      canvas,
      undefined,
      context.storyContext
    );
  });

  it('remounts when the story id changes', async () => {
    const first = fakeApp();
    const second = fakeApp();
    const bootstrap = vi.fn()
      .mockReturnValueOnce(first)
      .mockReturnValueOnce(second);
    const context = renderContext(() => '<p>Hello</p>');

    await renderToCanvas(context, canvas, bootstrap);
    const next = renderContext(() => '<p>Hello</p>', { id: 'test--other' });
    await renderToCanvas(next, canvas, bootstrap);

    expect(first.stop).toHaveBeenCalledOnce();
    expect(second.start).toHaveBeenCalledOnce();
  });

  it('remounts when structural story data changes', async () => {
    const first = fakeApp();
    const second = fakeApp();
    const bootstrap = vi.fn()
      .mockReturnValueOnce(first)
      .mockReturnValueOnce(second);
    const context = renderContext(() => '<p>First template</p>');

    await renderToCanvas(context, canvas, bootstrap);
    context.storyFn = vi.fn(() => '<p>Second template</p>');
    await renderToCanvas(context, canvas, bootstrap);

    expect(first.stop).toHaveBeenCalledOnce();
    expect(bootstrap).toHaveBeenCalledTimes(2);
  });

  it('remounts an automatic component story when its bound arg keys change', async () => {
    const first = fakeApp();
    const second = fakeApp();
    const bootstrap = vi.fn()
      .mockReturnValueOnce(first)
      .mockReturnValueOnce(second);
    const Component = class {};
    const context = renderContext(() => ({ Component, props: {} }));

    await renderToCanvas(context, canvas, bootstrap);
    context.storyFn = vi.fn(() => ({
      Component,
      props: { prop: 'now bound' },
    }));
    await renderToCanvas(context, canvas, bootstrap);

    expect(first.stop).toHaveBeenCalledOnce();
    expect(bootstrap).toHaveBeenCalledTimes(2);
  });

  it('remounts when Storybook requests it', async () => {
    const first = fakeApp();
    const second = fakeApp();
    const bootstrap = vi.fn()
      .mockReturnValueOnce(first)
      .mockReturnValueOnce(second);
    const context = renderContext(() => '<p>Hello</p>');

    await renderToCanvas(context, canvas, bootstrap);
    context.forceRemount = true;
    await renderToCanvas(context, canvas, bootstrap);

    expect(first.stop).toHaveBeenCalledOnce();
    expect(bootstrap).toHaveBeenCalledTimes(2);
  });

  it('serializes overlapping renders for the same canvas', async () => {
    let finishFirstStart!: () => void;
    const firstStartGate = new Promise<void>((resolve) => {
      finishFirstStart = resolve;
    });
    const lifecycle: string[] = [];
    const first = fakeApp();
    first.start.mockImplementationOnce(async () => {
      lifecycle.push('first:start');
      await firstStartGate;
      lifecycle.push('first:started');
    });
    first.stop.mockImplementationOnce(async () => {
      lifecycle.push('first:stop');
    });
    const second = fakeApp();
    second.start.mockImplementationOnce(async () => {
      lifecycle.push('second:start');
    });
    const bootstrap = vi.fn()
      .mockReturnValueOnce(first)
      .mockReturnValueOnce(second);
    const context = renderContext(() => '<p>Hello</p>');

    const firstRender = renderToCanvas(context, canvas, bootstrap);
    await vi.waitFor(() => expect(first.start).toHaveBeenCalledOnce());

    context.forceRemount = true;
    const secondRender = renderToCanvas(context, canvas, bootstrap);
    await Promise.resolve();

    expect(bootstrap).toHaveBeenCalledOnce();
    expect(second.start).not.toHaveBeenCalled();

    finishFirstStart();
    await firstRender;
    await secondRender;

    expect(lifecycle).toEqual([
      'first:start',
      'first:started',
      'first:stop',
      'second:start',
    ]);
  });

  it('does not let stale cleanup stop a newer app', async () => {
    const first = fakeApp();
    const second = fakeApp();
    const bootstrap = vi.fn()
      .mockReturnValueOnce(first)
      .mockReturnValueOnce(second);
    const context = renderContext(() => '<p>Hello</p>');

    const staleCleanup = await renderToCanvas(context, canvas, bootstrap);
    const next = renderContext(() => '<p>Other</p>', { id: 'test--other' });
    await renderToCanvas(next, canvas, bootstrap);
    await staleCleanup();

    expect(first.stop).toHaveBeenCalledOnce();
    expect(second.stop).not.toHaveBeenCalled();
  });

  it('reports exceptions thrown by the story function', async () => {
    const error = new Error('Story failed');
    const context = renderContext(() => {
      throw error;
    });
    const bootstrap = vi.fn();

    await renderToCanvas(context, canvas, bootstrap);

    expect(context.showException).toHaveBeenCalledWith(error);
    expect(bootstrap).not.toHaveBeenCalled();
  });

  it('stops a partially started app and reports startup errors', async () => {
    const error = new Error('Start failed');
    const app = fakeApp();
    app.start.mockRejectedValueOnce(error);
    const context = renderContext(() => '<p>Hello</p>');

    await renderToCanvas(context, canvas, vi.fn(() => app));

    expect(app.stop).toHaveBeenCalledOnce();
    expect(context.showException).toHaveBeenCalledWith(error);
    expect(context.showMain).not.toHaveBeenCalled();
  });

  it('uses a story Component in preference to the meta component', async () => {
    const StoryComponent = class {};
    const app = fakeApp();
    const bootstrap = vi.fn(() => app);
    const context = renderContext(() => ({ Component: StoryComponent }));

    await renderToCanvas(context, canvas, bootstrap);

    expect((bootstrap.mock.calls as unknown[][])[0][3]).toBe(StoryComponent);
  });

  it('creates one managed host inside the Storybook root', async () => {
    canvas.id = 'storybook-root';
    const app = fakeApp();
    const bootstrap = vi.fn(() => app);
    const context = renderContext(() => '<p>Hello</p>');

    await renderToCanvas(context, canvas, bootstrap);

    const host = canvas.querySelector('.aurelia-story-container');
    expect(host).toBeInstanceOf(HTMLElement);
    expect((bootstrap.mock.calls as unknown[][])[0][2]).toBe(host);
  });
});

describe('createComponentTemplate', () => {
  beforeEach(() => {
    aureliaMocks.getDefinition.mockReturnValue({
      name: 'dummy-comp',
      bindables: { prop: { attribute: 'prop', name: 'prop' } },
      key: 'au:ce:dummy-comp',
    });
  });

  it('binds every component bindable and keeps inner markup', () => {
    expect(
      createComponentTemplate(class {}, '<span>Inner</span>')
    ).toBe(
      '<dummy-comp prop.bind="prop"><span>Inner</span></dummy-comp>'
    );
  });

  it('leaves omitted bindables unset so component defaults are preserved', () => {
    expect(createComponentTemplate(class {}, undefined, {})).toBe(
      '<dummy-comp></dummy-comp>'
    );
    expect(
      createComponentTemplate(class {}, undefined, { prop: undefined })
    ).toBe('<dummy-comp prop.bind="prop"></dummy-comp>');
  });

  it('handles a component with no bindables', () => {
    aureliaMocks.getDefinition.mockReturnValueOnce({
      name: 'plain-component',
      bindables: {},
      key: 'au:ce:plain-component',
    });
    expect(createComponentTemplate(class {})).toBe(
      '<plain-component></plain-component>'
    );
  });
});
