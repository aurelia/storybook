import { SourceType } from 'storybook/internal/docs-tools';
import { emitTransformCode, useEffect, useRef } from 'storybook/preview-api';
import type { DecoratorFunction } from 'storybook/internal/types';
import { createComponentTemplate, normalizeStoryResult } from './preview/render';
import type { AureliaRenderer } from './preview/types';

function skipSourceRender(context: Parameters<DecoratorFunction<AureliaRenderer>>[1]) {
  const source = context.parameters.docs?.source;
  return (
    source?.type !== SourceType.DYNAMIC ||
    !context.parameters.__isArgsStory ||
    Boolean(source?.code)
  );
}

export const sourceDecorator: DecoratorFunction<AureliaRenderer> = (
  storyFn,
  context
) => {
  const previousSource = useRef<string | undefined>(undefined);
  const story = storyFn();

  useEffect(() => {
    const rendered = context.parameters.docs?.source?.excludeDecorators
      ? context.originalStoryFn(context.args, context)
      : story;
    const result = normalizeStoryResult(rendered);
    const component = result?.Component ?? context.component;
    const source =
      result?.template ??
      (component
        ? createComponentTemplate(component, result?.innerHtml, {
            ...context.args,
            ...result?.props,
          })
        : undefined);

    if (!skipSourceRender(context) && source && previousSource.current !== source) {
      emitTransformCode(source, context);
      previousSource.current = source;
    }
  });

  return story;
};

export const decorators = [sourceDecorator];

export const parameters = {
  docs: {
    story: { inline: true },
    source: {
      type: SourceType.DYNAMIC,
      language: 'html',
    },
  },
};
