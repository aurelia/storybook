const mocks = vi.hoisted(() => ({
  argTypesEnhancers: [vi.fn()],
  composeStories: vi.fn(() => ({ Composed: vi.fn() })),
  composeStory: vi.fn(() => vi.fn()),
  mount: vi.fn(),
  render: vi.fn(),
  renderToCanvas: vi.fn(),
  setDefaultProjectAnnotations: vi.fn(),
  setProjectAnnotations: vi.fn(() => ({ normalized: true })),
}));

vi.mock('storybook/preview-api', () => ({
  composeStories: mocks.composeStories,
  composeStory: mocks.composeStory,
  setDefaultProjectAnnotations: mocks.setDefaultProjectAnnotations,
  setProjectAnnotations: mocks.setProjectAnnotations,
}));

vi.mock('../src/preview/argtypes', () => ({
  argTypesEnhancers: mocks.argTypesEnhancers,
}));

vi.mock('../src/preview/mount', () => ({ mount: mocks.mount }));

vi.mock('../src/preview/render', () => ({
  render: mocks.render,
  renderToCanvas: mocks.renderToCanvas,
}));

import {
  aureliaProjectAnnotations,
  composeStories,
  composeStory,
  setProjectAnnotations,
} from '../src/preview/portable-stories';

describe('portable stories', () => {
  beforeEach(() => {
    Reflect.deleteProperty(globalThis, 'globalProjectAnnotations');
  });

  it('provides a complete default Aurelia project annotation', () => {
    expect(aureliaProjectAnnotations).toMatchObject({
      argTypesEnhancers: mocks.argTypesEnhancers,
      mount: mocks.mount,
      parameters: { renderer: 'aurelia' },
      render: mocks.render,
      renderToCanvas: mocks.renderToCanvas,
    });
  });

  it('sets Aurelia defaults before user project annotations', () => {
    const project = { parameters: { layout: 'centered' } };

    expect(setProjectAnnotations(project)).toEqual({ normalized: true });
    expect(mocks.setDefaultProjectAnnotations).toHaveBeenCalledWith(
      aureliaProjectAnnotations
    );
    expect(mocks.setProjectAnnotations).toHaveBeenCalledWith(project);
  });

  it('composes an individual story with Aurelia defaults', () => {
    const story = { args: { message: 'Hello' } };
    const meta = { title: 'Example', component: class {} };

    composeStory(story as never, meta as never, undefined, 'Default');

    expect(mocks.composeStory).toHaveBeenCalledWith(
      story,
      meta,
      undefined,
      aureliaProjectAnnotations,
      'Default'
    );
  });

  it('composes a CSF module with the Aurelia project annotations', () => {
    const stories = { default: { title: 'Example' }, Default: {} };

    expect(composeStories(stories as never)).toEqual({
      Composed: expect.any(Function),
    });
    expect(mocks.composeStories).toHaveBeenCalledWith(
      stories,
      aureliaProjectAnnotations,
      composeStory
    );
  });
});
