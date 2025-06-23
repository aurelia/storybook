import { render } from '../src/preview';
import * as renderUtils from '../src/preview/render';

jest.mock('../src/preview/render', () => ({
  ...jest.requireActual('../src/preview/render'),
  bootstrapAureliaApp: jest.fn(),
}));

describe('preview', () => {
  let bootstrapAureliaAppSpy: jest.SpyInstance;
  let fakeAureliaApp: { start: jest.Mock; stop: jest.Mock };

  beforeEach(() => {
    bootstrapAureliaAppSpy = jest.spyOn(renderUtils, 'bootstrapAureliaApp');
    fakeAureliaApp = {
      start: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockResolvedValue(undefined),
    };
    bootstrapAureliaAppSpy.mockReturnValue(fakeAureliaApp);
    document.body.innerHTML = '';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return a container element', () => {
    const context = {
      storyFn: () => ({ Component: class {} }),
      component: class {},
    };
    const container = render({}, context);
    expect(container).toBeInstanceOf(HTMLElement);
    expect(container.tagName).toBe('DIV');
  });

  it('should call storyFn', () => {
    const storyFn = jest.fn(() => ({ Component: class {} }));
    const context = {
      storyFn,
      component: class {},
    };
    render({}, context);
    expect(storyFn).toHaveBeenCalledTimes(1);
  });

  it('should not bootstrap Aurelia if story has no Component or template', () => {
    const context = {
      storyFn: () => ({}),
      component: class {},
    };
    render({}, context);
    expect(bootstrapAureliaAppSpy).not.toHaveBeenCalled();
  });

  it('should bootstrap Aurelia if story has a Component', () => {
    const DummyComponent = class {};
    const context = {
      storyFn: () => ({ Component: DummyComponent }),
      component: class {},
    };
    const args = { a: 1 };
    const container = render(args, context);
    expect(bootstrapAureliaAppSpy).toHaveBeenCalledWith(
      { Component: DummyComponent },
      args,
      container,
      DummyComponent
    );
    expect(fakeAureliaApp.start).toHaveBeenCalled();
  });

  it('should bootstrap Aurelia if story has a template', () => {
    const template = '<div></div>';
    const context = {
      storyFn: () => ({ template }),
      component: class {},
    };
    const args = { a: 1 };
    const container = render(args, context);
    expect(bootstrapAureliaAppSpy).toHaveBeenCalledWith(
      { template },
      args,
      container,
      context.component
    );
    expect(fakeAureliaApp.start).toHaveBeenCalled();
  });

  it('should call cleanup for the previous story', () => {
    const storyFn1 = () => ({ Component: class {} });
    const storyFn2 = () => ({ template: 'hello' });

    // First render
    render({}, { storyFn: storyFn1, component: class {} });

    // Second render
    render({}, { storyFn: storyFn2, component: class {} });

    expect(fakeAureliaApp.stop).toHaveBeenCalledTimes(1);
  });

  it('should handle Aurelia start failure', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Failed to start');
    fakeAureliaApp.start.mockRejectedValue(error);

    const context = {
      storyFn: () => ({ Component: class {} }),
      component: class {},
    };
    
    render({}, context);
    
    // allow microtasks to run
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to start Aurelia app:', error);
    consoleErrorSpy.mockRestore();
  });

  it('should handle Aurelia stop failure', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Failed to stop');
    fakeAureliaApp.stop.mockRejectedValue(error);
  
    // First render
    render({}, { storyFn: () => ({ Component: class {} }), component: class {} });
  
    // Second render to trigger cleanup
    render({}, { storyFn: () => ({ Component: class {} }), component: class {} });
    
    // allow microtasks to run
    await new Promise(resolve => setTimeout(resolve, 0));
  
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to stop Aurelia app:', error);
    consoleErrorSpy.mockRestore();
  });
}); 