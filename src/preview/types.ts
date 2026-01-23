import type { IContainer } from 'aurelia';
import type Aurelia from 'aurelia';
import type { Renderer, StoryContext, RenderContext, ArgsStoryFn } from './storybook-types';

export interface AureliaRenderer extends Renderer {
    /** The DOM element in which the story is rendered */
    canvasElement: HTMLElement;
  }

export interface AureliaStoryResult<TArgs = Record<string, unknown>> {
  template?: string;
  components?: unknown[];
  Component?: unknown;
  container?: IContainer;
  items?: unknown[];
  innerHtml?: string;
  props?: Partial<TArgs>;
}

export type AureliaStoryContext<TArgs = Record<string, unknown>> = StoryContext<
  AureliaRenderer,
  TArgs
>;
export type AureliaRenderContext<TArgs = Record<string, unknown>> = RenderContext<
  AureliaRenderer,
  TArgs
>;
export type AureliaArgsStoryFn<TArgs = Record<string, unknown>> = ArgsStoryFn<
  AureliaRenderer,
  TArgs
>;

export interface AureliaParameters<TArgs = Record<string, unknown>> {
  /**
   * Global resources/plugins to register with Aurelia (merged across preview + story parameters).
   */
  register?: unknown[];
  /**
   * Alias for register: match the story result `components` contract.
   */
  components?: unknown[];
  /**
   * Alias for register: match the story result `items` contract.
   */
  items?: unknown[];
  /**
   * Configure the container before the Aurelia app starts.
   */
  configureContainer?: (
    container: IContainer,
    context: AureliaStoryContext<TArgs>
  ) => void;
  /**
   * Configure the Aurelia instance before the app starts.
   */
  configure?: (aurelia: Aurelia, context: AureliaStoryContext<TArgs>) => void;
}

export interface AureliaStoryParameters<TArgs = Record<string, unknown>> {
  aurelia?: AureliaParameters<TArgs>;
}
  
