import { createAureliaApp } from '../src/preview/render';

const mocks = vi.hoisted(() => ({
  lastInstance: undefined as unknown,
  define: vi.fn((_definition: unknown, Type: new () => unknown) => Type),
  getDefinition: vi.fn(() => ({
    name: 'dummy',
    bindables: {},
    key: 'au:ce:dummy',
  })),
  isType: vi.fn((value: unknown) => typeof value === 'function'),
}));

vi.mock('aurelia', () => {
  class Aurelia {
    container: { has: ReturnType<typeof vi.fn> };
    register = vi.fn();
    app = vi.fn(() => ({
      start: vi.fn(),
      stop: vi.fn(),
      root: { controller: { viewModel: {} } },
    }));

    constructor(container?: { has: ReturnType<typeof vi.fn> }) {
      this.container = container ?? { has: vi.fn(() => false) };
      mocks.lastInstance = this;
    }
  }

  return {
    default: Aurelia,
    CustomElement: {
      define: mocks.define,
      getDefinition: mocks.getDefinition,
      isType: mocks.isType,
    },
  };
});

function lastAurelia() {
  return mocks.lastInstance as {
    container: { has: ReturnType<typeof vi.fn> };
    register: ReturnType<typeof vi.fn>;
    app: ReturnType<typeof vi.fn>;
  };
}

describe('createAureliaApp', () => {
  beforeEach(() => {
    mocks.getDefinition.mockReturnValue({
      name: 'dummy',
      bindables: {},
      key: 'au:ce:dummy',
    });
    mocks.isType.mockImplementation((value) => typeof value === 'function');
  });

  it('does not double-register the primary component', () => {
    const Component = class {};
    createAureliaApp(
      { template: '<dummy></dummy>', components: [Component] },
      {},
      document.createElement('div'),
      Component
    );

    const registrations = lastAurelia().register.mock.calls
      .flat()
      .filter((entry) => entry === Component);
    expect(registrations).toHaveLength(1);
  });

  it('skips a custom element already registered in the supplied container', () => {
    const Component = class {};
    const container = { has: vi.fn(() => true) };
    createAureliaApp(
      { template: '<dummy></dummy>', container: container as never },
      {},
      document.createElement('div'),
      Component
    );

    expect(container.has).toHaveBeenCalledWith('au:ce:dummy', false);
    expect(lastAurelia().register).not.toHaveBeenCalled();
  });

  it('registers global and story resources once, in order', () => {
    const Global = { register: vi.fn() };
    const Story = { register: vi.fn() };
    const Item = { register: vi.fn() };
    const context = {
      parameters: { aurelia: { register: [Global, Global] } },
    };
    mocks.isType.mockReturnValue(false);

    createAureliaApp(
      { template: '<div></div>', register: [Story], items: [Item, Story] },
      {},
      document.createElement('div'),
      undefined,
      context as never
    );

    expect(lastAurelia().register.mock.calls.flat()).toEqual([
      Global,
      Story,
      Item,
    ]);
  });

  it('runs container and Aurelia configuration hooks before returning the app', () => {
    const configureContainer = vi.fn();
    const configure = vi.fn();
    const context = {
      parameters: {
        aurelia: { configureContainer, configure },
      },
    };

    createAureliaApp(
      { template: '<div></div>' },
      {},
      document.createElement('div'),
      undefined,
      context as never
    );

    const aurelia = lastAurelia();
    expect(configureContainer).toHaveBeenCalledWith(aurelia.container, context);
    expect(configure).toHaveBeenCalledWith(aurelia, context);
    expect(aurelia.app).toHaveBeenCalledOnce();
  });

  it('creates a generated template for a component-only story', () => {
    const Component = class {};
    createAureliaApp(
      {},
      { message: 'Hello' },
      document.createElement('div'),
      Component
    );

    expect(mocks.define).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'sb-aurelia-story',
        template: '<dummy></dummy>',
      }),
      expect.any(Function)
    );
  });
});
