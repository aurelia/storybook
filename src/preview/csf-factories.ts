/* eslint-disable @typescript-eslint/no-explicit-any -- decorator inference follows Storybook's renderer factory contract */

import type {
  AddonTypes,
  InferTypes,
  Meta as FactoryMeta,
  Preview as FactoryPreview,
  PreviewAddon,
  Story as FactoryStory,
} from 'storybook/internal/csf';
import { definePreview as definePreviewBase } from 'storybook/internal/csf';
import type {
  Args,
  ArgsStoryFn,
  ComponentAnnotations,
  DecoratorFunction,
  ProjectAnnotations,
  Renderer,
  StoryAnnotations,
} from 'storybook/internal/types';
import * as aureliaAnnotations from '../preview';
import * as aureliaDocsAnnotations from '../preview-docs';
import type {
  AureliaComponent,
  AureliaRenderer,
  AureliaStoryParameters,
} from './types';

type Simplify<T> = { [Key in keyof T]: T[Key] } & {};
type SetOptional<T, Key extends keyof T> = Omit<T, Key> & Partial<Pick<T, Key>>;
type OmitIndexSignature<T> = {
  [Key in keyof T as string extends Key
    ? never
    : number extends Key
      ? never
      : symbol extends Key
        ? never
        : Key]: T[Key];
};
type UnionToIntersection<T> = (
  T extends unknown ? (value: T) => void : never
) extends (value: infer Intersection) => void
  ? Intersection
  : never;

type ComponentArgs<TComponent> =
  TComponent extends AureliaComponent<infer TInstance>
    ? Partial<TInstance>
    : Args;

type DecoratorArgs<TRenderer extends Renderer, TDecorators> =
  UnionToIntersection<
    TDecorators extends DecoratorFunction<TRenderer, infer TArgs>
      ? TArgs
      : unknown
  >;

type InferArgs<TArgs, TTypes, TDecorators> = Simplify<
  TArgs &
    Simplify<
      OmitIndexSignature<
        DecoratorArgs<AureliaTypes & TTypes, TDecorators>
      >
    >
>;

type InferAureliaTypes<TTypes, TArgs, TDecorators> = AureliaTypes &
  TTypes & {
    args: Simplify<InferArgs<TArgs, TTypes, TDecorators>>;
  };

/** Renderer and parameter types used by Storybook's CSF Factories API. */
export interface AureliaTypes extends AureliaRenderer {
  parameters: AureliaStoryParameters;
}

/**
 * Creates an Aurelia preview with Storybook's typed CSF Factories API.
 * Renderer and docs annotations are included automatically.
 */
export function __definePreview<Addons extends PreviewAddon<never>[]>(
  input: { addons: Addons } & ProjectAnnotations<
    AureliaTypes & InferTypes<Addons>
  >
): AureliaPreview<AureliaTypes & InferTypes<Addons>> {
  return definePreviewBase({
    ...input,
    addons: [
      aureliaAnnotations,
      aureliaDocsAnnotations,
      ...(input.addons ?? []),
    ],
  }) as unknown as AureliaPreview<AureliaTypes & InferTypes<Addons>>;
}

export { __definePreview as definePreview };

/** Aurelia-specific preview returned by `definePreview`. */
export interface AureliaPreview<T extends AddonTypes>
  extends FactoryPreview<AureliaTypes & T> {
  type<ExtraTypes>(): AureliaPreview<T & ExtraTypes>;

  meta<
    Component extends AureliaComponent,
    Decorators extends DecoratorFunction<AureliaTypes & T, any>,
    MetaArgs extends Partial<ComponentArgs<Component> & T['args']>,
  >(
    meta: {
      component?: Component;
      args?: MetaArgs;
      decorators?: Decorators | Decorators[];
    } & Omit<
      ComponentAnnotations<
        AureliaTypes & T,
        ComponentArgs<Component> & T['args']
      >,
      'decorators' | 'component' | 'args'
    >
  ): AureliaMeta<
    InferAureliaTypes<T, ComponentArgs<Component>, Decorators>,
    Omit<
      ComponentAnnotations<
        InferAureliaTypes<T, ComponentArgs<Component>, Decorators>
      >,
      'args'
    > & {
      args: keyof MetaArgs extends never ? Record<never, never> : MetaArgs;
    }
  >;

  meta<
    TArgs extends Args,
    Decorators extends DecoratorFunction<AureliaTypes & T, any>,
    MetaArgs extends Partial<TArgs>,
  >(
    meta: {
      render?: ArgsStoryFn<AureliaTypes & T, TArgs>;
      args?: MetaArgs;
      decorators?: Decorators | Decorators[];
    } & Omit<
      ComponentAnnotations<AureliaTypes & T, TArgs & T['args']>,
      'decorators' | 'component' | 'args' | 'render'
    >
  ): AureliaMeta<
    InferAureliaTypes<T, TArgs, Decorators>,
    Omit<
      ComponentAnnotations<InferAureliaTypes<T, TArgs, Decorators>>,
      'args'
    > & {
      args: keyof MetaArgs extends never ? Record<never, never> : MetaArgs;
    }
  >;
}

/** Aurelia component metadata returned by `preview.meta`. */
export interface AureliaMeta<
  T extends AureliaTypes,
  MetaInput extends ComponentAnnotations<T>,
>
  // Storybook's factory Meta constraint resolves the renderer's inferred args
  // more narrowly than ComponentAnnotations does at this declaration boundary.
  // @ts-expect-error The public overloads below preserve the inferred args.
  extends FactoryMeta<T, MetaInput> {
  story<
    Input extends
      | (() => AureliaTypes['storyResult'])
      | (StoryAnnotations<T, T['args']> & {
          render: () => AureliaTypes['storyResult'];
        }),
  >(
    story: Input
  ): AureliaFactoryStory<
    T,
    Input extends () => AureliaTypes['storyResult']
      ? { render: Input }
      : Input
  >;

  story<
    Input extends Simplify<
      StoryAnnotations<
        T,
        T['args'],
        SetOptional<T['args'], keyof T['args'] & keyof MetaInput['args']>
      >
    >,
  >(story: Input): AureliaFactoryStory<T, Input>;

  story(
    ...args: Partial<T['args']> extends SetOptional<
      T['args'],
      keyof T['args'] & keyof MetaInput['args']
    >
      ? []
      : [never]
  ): AureliaFactoryStory<T, Record<never, never>>;
}

/** Aurelia story returned by `meta.story`. */
export type AureliaFactoryStory<
  T extends AureliaTypes,
  Input extends StoryAnnotations<T, T['args']>,
> = FactoryStory<T, Input>;
