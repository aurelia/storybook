import type Aurelia from 'aurelia';
import type { Constructable, IContainer } from 'aurelia';
import type {
  AnnotatedStoryFn,
  Args,
  ArgsFromMeta,
  ArgsStoryFn,
  Canvas,
  ComponentAnnotations,
  DecoratorFunction,
  LoaderFunction,
  ProjectAnnotations,
  StoryAnnotations,
  StoryContext as BaseStoryContext,
  StrictArgs,
  WebRenderer,
} from 'storybook/internal/types';

export type AureliaComponent<T = object> = Constructable<T>;

export interface AureliaStoryResult<TArgs = Args> {
  /** Aurelia markup to compile for this story. */
  template?: string;
  /** Component used by this story. Overrides the component from the default export. */
  Component?: AureliaComponent;
  /** Resources registered before the story starts. */
  components?: unknown[];
  /** Alias for components, useful for plugins and DI registrations. */
  register?: unknown[];
  /** DI registrations and other Aurelia registry items. */
  items?: unknown[];
  /** Existing container to use for this Aurelia app. */
  container?: IContainer;
  /** Markup placed inside the generated component element. */
  innerHtml?: string;
  /** Values exposed to the story template. Story props override Storybook args. */
  props?: Partial<TArgs>;
}

export type AureliaStoryFnResult<TArgs = Args> =
  | AureliaStoryResult<TArgs>
  | AureliaComponent
  | string;

export interface AureliaMountOptions<TArgs = Args>
  extends Omit<AureliaStoryResult<TArgs>, 'Component' | 'template'> {
  template?: string;
}

export type AureliaMount<TArgs = Args> = (
  story?: AureliaStoryFnResult<TArgs>,
  options?: AureliaMountOptions<TArgs>
) => Promise<Canvas>;

export interface AureliaRenderer extends WebRenderer {
  component: AureliaComponent;
  storyResult: AureliaStoryFnResult;
  mount: AureliaMount;
}

export type AureliaStoryContext<TArgs = StrictArgs> = BaseStoryContext<
  AureliaRenderer,
  TArgs
>;

export type AureliaArgsStoryFn<TArgs = Args> = ArgsStoryFn<
  AureliaRenderer,
  TArgs
>;

export interface AureliaParameters<TArgs = Args> {
  /** Resources and plugins registered for every matching story. */
  register?: unknown[];
  /** Alias for register. */
  components?: unknown[];
  /** Alias for register, intended for DI registrations. */
  items?: unknown[];
  /** Configure the container before resources are registered. */
  configureContainer?: (
    container: IContainer,
    context: AureliaStoryContext<TArgs>
  ) => unknown;
  /** Configure the Aurelia instance before setup hooks and start. */
  configure?: (
    aurelia: Aurelia,
    context: AureliaStoryContext<TArgs>
  ) => unknown;
}

export interface AureliaStoryParameters<TArgs = Args> {
  aurelia?: AureliaParameters<TArgs>;
}

type Simplify<T> = { [Key in keyof T]: T[Key] } & {};
type SetOptional<T, Key extends keyof T> = Omit<T, Key> & Partial<Pick<T, Key>>;
type ComponentPropsOrArgs<TComponentOrArgs> =
  TComponentOrArgs extends Constructable<infer TInstance>
    ? Partial<TInstance>
    : TComponentOrArgs extends Args
      ? TComponentOrArgs
      : Args;

/** Metadata for an Aurelia component or an explicit args type. */
export type Meta<TComponentOrArgs = Args> = ComponentAnnotations<
  AureliaRenderer,
  ComponentPropsOrArgs<TComponentOrArgs>
>;

/** CSF2 story function for Aurelia. */
export type StoryFn<TComponentOrArgs = Args> = AnnotatedStoryFn<
  AureliaRenderer,
  ComponentPropsOrArgs<TComponentOrArgs>
>;

/** CSF3 story object for Aurelia. */
export type StoryObj<TMetaOrComponentOrArgs = Args> =
  TMetaOrComponentOrArgs extends {
    render?: ArgsStoryFn<AureliaRenderer, Args>;
    component?: infer TComponent;
    args?: infer TDefaultArgs;
  }
    ? Simplify<
        ComponentPropsOrArgs<TComponent> &
          ArgsFromMeta<AureliaRenderer, TMetaOrComponentOrArgs>
      > extends infer TArgs extends Args
      ? StoryAnnotations<
          AureliaRenderer,
          TArgs,
          SetOptional<TArgs, Extract<keyof TArgs, keyof TDefaultArgs>>
        >
      : never
    : StoryAnnotations<
        AureliaRenderer,
        ComponentPropsOrArgs<TMetaOrComponentOrArgs>
      >;

export type Decorator<TArgs = StrictArgs> = DecoratorFunction<
  AureliaRenderer,
  TArgs
>;
export type Loader<TArgs = StrictArgs> = LoaderFunction<AureliaRenderer, TArgs>;
export type StoryContext<TArgs = StrictArgs> = BaseStoryContext<
  AureliaRenderer,
  TArgs
>;
export type Preview = ProjectAnnotations<AureliaRenderer>;

export type AureliaSetup = (
  aurelia: Aurelia,
  context: AureliaStoryContext
) => unknown | Promise<unknown>;

export type { Args, StrictArgs } from 'storybook/internal/types';
