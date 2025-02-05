import { STORY_CHANGED } from '@storybook/core-events';
import type { RenderContext, ArgsStoryFn } from '@storybook/types';
import type { AureliaRenderer } from './types';
import Aurelia, { Constructable, CustomElement } from 'aurelia';

interface AureliaStoryResult {
  template: string;
  components?: unknown[];
  Component?: unknown;
  container?: any;
  items?: unknown[];
  innerHtml?: string;
  props?: Record<string, any>;
}

/**
 * Merges multiple sources into a single object.
 * Sources can be story parameters, args, or story.props.
 */
function mergeStoryProps(
  ...sources: Array<Record<string, any> | undefined>
): Record<string, any> {
  return Object.assign({}, ...sources);
}

// Track Aurelia apps for cleanup
const appMap = new Map<HTMLElement, Aurelia>();

async function teardown(element: HTMLElement) {
  if (appMap.has(element)) {
    const app = appMap.get(element);
    if (app) {
      await app.stop();
      appMap.delete(element);
    }
  }
}

export const render: ArgsStoryFn<AureliaRenderer> = (args, { id, component: Component }) => {
  if (!Component) {
    throw new Error(
      `Unable to render story ${id} as the component annotation is missing from the default export`
    );
  }
  return { Component, props: args, template: '' };
};

export async function renderToCanvas(
  {
    storyFn,
    title,
    name,
    showMain,
    showError,
    storyContext,
    forceRemount,
  }: RenderContext<AureliaRenderer>,
  canvasElement: HTMLElement,
  bootstrapAppFn?: typeof bootstrapAureliaApp
) {
  const appBootstrapFn = bootstrapAppFn || bootstrapAureliaApp;

  const { parameters, component, args } = storyContext;
  let app = appMap.get(canvasElement);

  const story = storyFn() as AureliaStoryResult;

  if (!story) {
    showError({
      title: `Expecting an Aurelia component from the story: "${name}" of "${title}".`,
      description: `
        Did you forget to return the Aurelia component from the story?
        Use "() => ({ template: '<custom-component></custom-component>' })" when defining the story.
      `,
    });
    return () => {};
  }

  showMain();

  let mergedProps;
  // Use full merge (including story.props) when bootstrapping a new app or force remounting.
  if (!app || forceRemount) {
    mergedProps = mergeStoryProps(parameters?.args, args, story.props);
    if (app) {
      await teardown(canvasElement);
    }
    app = appBootstrapFn(
      story,
      mergedProps,
      canvasElement,
      component as Constructable
    ) as Aurelia;
    await app.start();
    appMap.set(canvasElement, app);
  } else {
    // Update the existing app viewModel only with parameters and args (exclude story.props).
    mergedProps = mergeStoryProps(parameters?.args, args);
    if (app.root?.controller?.viewModel) {
      Object.assign(app.root.controller.viewModel, mergedProps);
    }
  }

  // Set up story change listener for cleanup
  const channel = storyContext.viewMode === 'story' ? storyContext.channel : null;
  let onStoryChange: () => void;
  if (channel) {
    onStoryChange = () => {
      // When the story changes, clean up the Aurelia app
      teardown(canvasElement);
    };
    channel.on(STORY_CHANGED, onStoryChange);
  }

  // Return teardown function that also unsubscribes from STORY_CHANGED
  return async () => {
    if (channel && onStoryChange) {
      channel.off(STORY_CHANGED, onStoryChange);
    }
    await teardown(canvasElement);
  };
}

export function bootstrapAureliaApp(
  story: AureliaStoryResult,
  args: Record<string, any>,
  domElement: HTMLElement,
  component?: Constructable
) {
  const aurelia = new Aurelia(story.container);

  if (story.items?.length) {
    aurelia.register(...story.items);
  }

  if (story.components?.length) {
    aurelia.register(...story.components);
  }

  let { template } = story;

  if (component) {
    template = template ?? createComponentTemplate(component, story.innerHtml);
    aurelia.register(component);
  }

  const App = CustomElement.define(
    {
      name: 'au-storybook',
      template,
      containerless: true,
    },
    class {}
  );

  const app = Object.assign(new App(), args);

  return aurelia.app({
    host: domElement,
    component: app,
  });
}

export function createComponentTemplate(
  component: Constructable,
  innerHtml?: string
): string {
  const def = CustomElement.getDefinition(component);

  return `<${def.name} ${Object.values(def.bindables)
    .map((bindable) => `${bindable.attribute}.bind="${bindable.name}"`)
    .join(' ')}>${innerHtml ?? ''}</${def.name}>`;
}