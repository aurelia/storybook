import {
  composeStories as composeStoriesBase,
  composeStory as composeStoryBase,
  setDefaultProjectAnnotations,
  setProjectAnnotations as setProjectAnnotationsBase,
} from 'storybook/preview-api';
import type {
  Args,
  ComponentAnnotations,
  ComposedStoryFn,
  NamedOrDefaultProjectAnnotations,
  NormalizedProjectAnnotations,
  ProjectAnnotations,
  StoriesWithPartialProps,
  Store_CSFExports,
  StoryAnnotationsOrFn,
} from 'storybook/internal/types';
import { argTypesEnhancers } from './argtypes';
import { mount } from './mount';
import { render, renderToCanvas } from './render';
import type { AureliaRenderer } from './types';

export const aureliaProjectAnnotations: ProjectAnnotations<AureliaRenderer> = {
  argTypesEnhancers,
  mount,
  parameters: {
    renderer: 'aurelia',
  },
  render,
  renderToCanvas,
};

export function setProjectAnnotations(
  projectAnnotations:
    | NamedOrDefaultProjectAnnotations
    | NamedOrDefaultProjectAnnotations[]
): NormalizedProjectAnnotations<AureliaRenderer> {
  setDefaultProjectAnnotations(aureliaProjectAnnotations);
  return setProjectAnnotationsBase(projectAnnotations) as NormalizedProjectAnnotations<AureliaRenderer>;
}

export function composeStory<TArgs extends Args>(
  story: StoryAnnotationsOrFn<AureliaRenderer, TArgs>,
  componentAnnotations: ComponentAnnotations<AureliaRenderer, TArgs>,
  projectAnnotations?: ProjectAnnotations<AureliaRenderer>,
  exportsName?: string
): ComposedStoryFn<AureliaRenderer, Partial<TArgs>> {
  const defaultAnnotations =
    (globalThis as typeof globalThis & {
      globalProjectAnnotations?: ProjectAnnotations<AureliaRenderer>;
    }).globalProjectAnnotations ?? aureliaProjectAnnotations;
  return composeStoryBase(
    story as StoryAnnotationsOrFn<AureliaRenderer, Args>,
    componentAnnotations as ComponentAnnotations<AureliaRenderer, Args>,
    projectAnnotations,
    defaultAnnotations,
    exportsName
  ) as ComposedStoryFn<AureliaRenderer, Partial<TArgs>>;
}

export function composeStories<
  TModule extends Store_CSFExports<AureliaRenderer, Args>,
>(
  stories: TModule,
  projectAnnotations?: ProjectAnnotations<AureliaRenderer>
): Omit<
  StoriesWithPartialProps<AureliaRenderer, TModule>,
  keyof Store_CSFExports
> {
  return composeStoriesBase(
    stories,
    projectAnnotations ?? aureliaProjectAnnotations,
    composeStory
  ) as Omit<
    StoriesWithPartialProps<AureliaRenderer, TModule>,
    keyof Store_CSFExports
  >;
}
