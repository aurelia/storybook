import type { Args } from 'storybook/internal/types';
import type {
  AureliaComponent,
  AureliaMount,
  AureliaMountOptions,
  AureliaStoryContext,
  AureliaStoryFnResult,
  AureliaStoryResult,
} from './types';

function toStoryResult<TArgs extends Args>(
  input: AureliaStoryFnResult<TArgs>,
  options: AureliaMountOptions<TArgs>
): AureliaStoryResult<TArgs> {
  const base: AureliaStoryResult<TArgs> =
    typeof input === 'string'
      ? { template: input }
      : typeof input === 'function'
        ? { Component: input as AureliaComponent }
        : input;

  return {
    ...base,
    ...options,
    props: { ...base.props, ...options.props } as Partial<TArgs>,
    register: [...(base.register ?? []), ...(options.register ?? [])],
    components: [...(base.components ?? []), ...(options.components ?? [])],
    items: [...(base.items ?? []), ...(options.items ?? [])],
  };
}

export const mount =
  (context: AureliaStoryContext): AureliaMount =>
  async (input, options = {}) => {
    const story = input
      ? toStoryResult(input, options)
      : context.originalStoryFn(context.args, context);
    const internalContext = context as AureliaStoryContext & {
      originalStoryFn: () => AureliaStoryFnResult;
      renderToCanvas: () => Promise<void>;
    };
    internalContext.originalStoryFn = () => story;
    await internalContext.renderToCanvas();
    return context.canvas;
  };
