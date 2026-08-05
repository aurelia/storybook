const mocks = vi.hoisted(() => ({
  emitTransformCode: vi.fn(),
  useEffect: vi.fn((callback: () => void) => callback()),
  useRef: vi.fn((value: unknown) => ({ current: value })),
}));

vi.mock('storybook/preview-api', () => ({
  emitTransformCode: mocks.emitTransformCode,
  useEffect: mocks.useEffect,
  useRef: mocks.useRef,
}));

import { SourceType } from 'storybook/internal/docs-tools';
import { sourceDecorator } from '../src/preview-docs';

function createContext(overrides: Record<string, unknown> = {}) {
  return {
    args: { message: 'Hello' },
    component: undefined,
    originalStoryFn: vi.fn(() => ({
      template: '<p>${message}</p>',
    })),
    parameters: {
      __isArgsStory: true,
      docs: {
        source: { type: SourceType.DYNAMIC },
      },
    },
    ...overrides,
  };
}

describe('docs source decorator', () => {
  it('emits the Aurelia template used by a dynamic args story', () => {
    const context = createContext();
    const story = { template: '<h2>${message}</h2>' };

    expect(sourceDecorator(() => story, context as never)).toBe(story);
    expect(mocks.emitTransformCode).toHaveBeenCalledWith(
      '<h2>${message}</h2>',
      context
    );
  });

  it('uses the undecorated story when source decorators are excluded', () => {
    const context = createContext({
      parameters: {
        __isArgsStory: true,
        docs: {
          source: {
            type: SourceType.DYNAMIC,
            excludeDecorators: true,
          },
        },
      },
    });

    sourceDecorator(
      () => ({ template: '<section><p>${message}</p></section>' }),
      context as never
    );

    expect(context.originalStoryFn).toHaveBeenCalledWith(
      context.args,
      context
    );
    expect(mocks.emitTransformCode).toHaveBeenCalledWith(
      '<p>${message}</p>',
      context
    );
  });

  it('preserves hand-written source code', () => {
    const context = createContext({
      parameters: {
        __isArgsStory: true,
        docs: {
          source: {
            type: SourceType.DYNAMIC,
            code: '<hello-world></hello-world>',
          },
        },
      },
    });

    sourceDecorator(
      () => ({ template: '<p>${message}</p>' }),
      context as never
    );

    expect(mocks.emitTransformCode).not.toHaveBeenCalled();
  });
});
