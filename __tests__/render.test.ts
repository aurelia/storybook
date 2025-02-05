import { STORY_CHANGED } from '@storybook/core-events';
import { CustomElement } from 'aurelia';
import {
  render,
  renderToCanvas,
  bootstrapAureliaApp,
  createComponentTemplate,
} from '../src/preview/render';

// Add this at the very top of the file, before any imports.
jest.mock('aurelia', () => {
  const actual = jest.requireActual('aurelia');
  return {
    ...actual,
    CustomElement: {
      ...actual.CustomElement,
      getDefinition: jest.fn().mockReturnValue({
         name: 'dummy-comp',
         bindables: { prop: { attribute: 'prop', name: 'prop' } },
      }),
    },
  };
});

describe('render', () => {
  it('throws an error when no component is provided', () => {
    expect(() =>
      render({}, { id: 'story-1', component: undefined as any } as any)
    ).toThrowError(
      'Unable to render story story-1 as the component annotation is missing from the default export'
    );
  });

  it('returns the expected object when a component is provided', () => {
    const DummyComponent = () => {};
    const args = { foo: 'bar' };
    const result = render(args, { id: 'story-1', component: DummyComponent as any } as any);
    expect(result).toEqual({ Component: DummyComponent, props: args, template: '' });
  });
});

describe('renderToCanvas', () => {
  let canvas: HTMLElement;
  let dummyChannel: { on: jest.Mock; off: jest.Mock };
  const DummyComponent = class {};

  beforeEach(() => {
    canvas = document.createElement('div');
    dummyChannel = { on: jest.fn(), off: jest.fn() } as any;
  });

  it('calls showError when the story function returns a falsy value', async () => {
    const storyFn = jest.fn(() => null) as any;
    const showError = jest.fn() as any;
    const showMain = jest.fn() as any;
    const context = {
      storyFn,
      title: 'Test Title',
      name: 'Test Story',
      showMain,
      showError,
      storyContext: {
        parameters: {},
        component: DummyComponent as any,
        args: {},
        viewMode: 'story',
        channel: dummyChannel,
      },
      forceRemount: false,
    } as any;

    const cleanup = await renderToCanvas(context, canvas);
    expect(showError).toHaveBeenCalled();
    expect(typeof cleanup).toBe('function');
  });

  it('bootstraps an Aurelia app when none exists or forceRemount is true', async () => {
    const fakeAurelia = {
      start: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockResolvedValue(undefined),
      root: { controller: { viewModel: {} } },
    } as any;
    const story = { template: '<div></div>', props: { test: 'value' } } as any;
    const storyFn = jest.fn(() => story) as any;
    const showError = jest.fn() as any;
    const showMain = jest.fn() as any;

    // Spy on bootstrapAureliaApp to simulate app creation.
    const bootstrapSpy = jest
      .spyOn(require('../src/preview/render'), 'bootstrapAureliaApp')
      .mockReturnValue(fakeAurelia);

    const context = {
      storyFn,
      title: 'Test Title',
      name: 'Test Story',
      showMain,
      showError,
      storyContext: {
        parameters: { args: { param: 'foo' } },
        component: DummyComponent as any,
        args: { test: 'bar' },
        viewMode: 'story',
        channel: dummyChannel,
      },
      forceRemount: false,
    } as any;

    const cleanup = await renderToCanvas(context, canvas, bootstrapAureliaApp);
    expect(showError).not.toHaveBeenCalled();
    expect(showMain).toHaveBeenCalled();
    expect(bootstrapSpy).toHaveBeenCalled();

    // Simulate cleanup (which should remove the STORY_CHANGED listener)
    await cleanup();
    expect(dummyChannel.off).toHaveBeenCalledWith(
      STORY_CHANGED,
      expect.any(Function)
    );
    bootstrapSpy.mockRestore();
  });

  it('updates the existing app viewModel when re-rendering without forceRemount', async () => {
    // Create a fake Aurelia app with a mutable viewModel.
    const fakeViewModel: Record<string, any> = {};
    const fakeAurelia = {
      start: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockResolvedValue(undefined),
      root: { controller: { viewModel: fakeViewModel } },
    } as any;

    const story = { template: '<div></div>', props: { test: 'initial' } } as any;
    const storyFn = jest.fn(() => story) as any;
    const showError = jest.fn() as any;
    const showMain = jest.fn() as any;

    const bootstrapSpy = jest
      .spyOn(require('../src/preview/render'), 'bootstrapAureliaApp')
      .mockReturnValue(fakeAurelia);

    // First render: bootstrap the app.
    const context = {
      storyFn,
      title: 'Title',
      name: 'Name',
      showMain,
      showError,
      storyContext: {
        parameters: { args: { param: 'foo' } },
        component: DummyComponent as any,
        args: { test: 'bar' },
        viewMode: 'story',
        channel: dummyChannel,
      },
      forceRemount: false,
    } as any;
    await renderToCanvas(context, canvas, bootstrapAureliaApp);
    expect(bootstrapSpy).toHaveBeenCalledTimes(1);

    // Second render with new args; should update viewModel instead of re-bootstrap.
    const newStory = { template: '<div></div>', props: { test: 'updated' } } as any;
    storyFn.mockReturnValueOnce(newStory);
    const newContext = {
      ...context,
      storyContext: {
        ...context.storyContext,
        parameters: { args: { param: 'baz' } },
        args: { test: 'qux' },
      },
    } as any;
    await renderToCanvas(newContext, canvas, bootstrapAureliaApp);
    expect(bootstrapSpy).toHaveBeenCalledTimes(1);
    expect(fakeViewModel).toEqual({ param: 'baz', test: 'qux' });
    bootstrapSpy.mockRestore();
  });
});

describe('createComponentTemplate', () => {
  it('generates the correct template string', () => {
    const DummyComponent = class {};
    // The definition is already provided via module mocking.

    const template = createComponentTemplate(DummyComponent as any, '<span>inner</span>');
    expect(template).toBe(
      '<dummy-comp prop.bind="prop"><span>inner</span></dummy-comp>'
    );
  });
});
