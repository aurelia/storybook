import { createAureliaApp } from '../src/preview/render';

jest.mock('aurelia', () => {
  let lastInstance: any;

  class Aurelia {
    public container: { has: jest.Mock };
    public register = jest.fn();
    public app = jest.fn(() => ({}));

    constructor(container?: unknown) {
      this.container = (container as any) ?? { has: jest.fn(() => false) };
      lastInstance = this;
    }
  }

  const CustomElement = {
    define: jest.fn((definition: unknown, Type: new () => unknown) => Type),
    getDefinition: jest.fn(() => ({ name: 'dummy', bindables: {}, key: 'au:ce:dummy' })),
    isType: jest.fn(() => true),
  };

  return {
    __esModule: true,
    default: Aurelia,
    CustomElement,
    __getLastInstance: () => lastInstance,
  };
});

describe('createAureliaApp', () => {
  it('does not double-register the component when included in components', () => {
    const Component = class {};
    const host = document.createElement('div');

    createAureliaApp(
      { template: '<dummy></dummy>', components: [Component] } as any,
      {},
      host,
      Component as any
    );

    const aurelia = (jest.requireMock('aurelia') as any).__getLastInstance();
    const registerArgs = aurelia.register.mock.calls.flat();
    const registrations = registerArgs.filter((entry: unknown) => entry === Component);
    expect(registrations).toHaveLength(1);
  });

  it('skips registration when the container already has the component key', () => {
    const Component = class {};
    const host = document.createElement('div');
    const container = { has: jest.fn(() => true) };

    createAureliaApp(
      { template: '<dummy></dummy>', components: [] as any, container } as any,
      {},
      host,
      Component as any
    );

    const aurelia = (jest.requireMock('aurelia') as any).__getLastInstance();
    expect(container.has).toHaveBeenCalled();
    expect(aurelia.register).not.toHaveBeenCalled();
  });

  it('applies parameters.aurelia registrations and hooks', () => {
    const GlobalComponent = class {};
    const host = document.createElement('div');
    const configureContainer = jest.fn();
    const configure = jest.fn();
    const storyContext = {
      parameters: {
        aurelia: {
          register: [GlobalComponent],
          configureContainer,
          configure,
        },
      },
    } as any;

    createAureliaApp(
      { template: '<dummy></dummy>' } as any,
      {},
      host,
      undefined,
      storyContext
    );

    const aurelia = (jest.requireMock('aurelia') as any).__getLastInstance();
    expect(configureContainer).toHaveBeenCalledWith(aurelia.container, storyContext);
    expect(aurelia.register).toHaveBeenCalledWith(GlobalComponent);
    expect(configure).toHaveBeenCalledWith(aurelia, storyContext);
  });
});
