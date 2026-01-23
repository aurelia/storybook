export interface Renderer {
  component?: unknown;
  storyResult?: unknown;
  canvasElement?: HTMLElement;
}

export interface StoryContext<
  TRenderer = Renderer,
  TArgs = Record<string, unknown>
> {
  id?: string;
  component?: unknown;
  args: TArgs;
  parameters?: { args?: Record<string, unknown> } & Record<string, unknown>;
  [key: string]: unknown;
}

export type ArgsStoryFn<
  TRenderer = Renderer,
  TArgs = Record<string, unknown>
> = (args: TArgs, context: StoryContext<TRenderer, TArgs>) => unknown;

export interface RenderContext<
  TRenderer = Renderer,
  TArgs = Record<string, unknown>
> {
  storyFn: () => unknown;
  title: string;
  name: string;
  showMain: () => void;
  showError: (error: { title: string; description?: string }) => void;
  storyContext: StoryContext<TRenderer, TArgs>;
  forceRemount?: boolean;
}
