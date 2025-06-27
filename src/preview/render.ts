import { STORY_CHANGED } from 'storybook/internal/core-events';
import type { RenderContext, ArgsStoryFn } from 'storybook/internal/types';
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

// Track Aurelia apps for cleanup
const appMap = new Map<HTMLElement, any>();

async function teardown(element: HTMLElement) {
  if (appMap.has(element)) {
    const app = appMap.get(element);
    if (app) {
      await app.stop();
      appMap.delete(element);
    }
  }
}

export const render: ArgsStoryFn<AureliaRenderer> = (args, context) => {
  const { id, component: Component } = context;
  
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
  bootstrapAppFn?: typeof createAureliaApp
) {
  // Store reference to the original storybook root element
  const rootElement = canvasElement;

  // Ensure we have (or create) a single container inside the root where the Aurelia app actually renders
  let hostElement: HTMLElement;
  if (rootElement.id === 'storybook-root') {
    hostElement = rootElement.querySelector('.aurelia-story-container') as HTMLElement;
    if (!hostElement) {
      hostElement = document.createElement('div');
      hostElement.className = 'aurelia-story-container';
      hostElement.style.height = '100%';
      rootElement.appendChild(hostElement);
    }
  } else {
    hostElement = rootElement;
  }

  // All app instances are now tracked by the *root* element, ensuring we only ever have one per story iframe
  const appBootstrapFn = bootstrapAppFn ?? createAureliaApp;
  const { parameters, component, args } = storyContext;
  
  let app = appMap.get(rootElement);
  const story = storyFn() as AureliaStoryResult;
  
  // Temporary debug logging
  console.log(`[DEBUG] Story: ${name}, forceRemount: ${forceRemount}, hasExistingApp: ${!!app}, canvasId: ${canvasElement.className}`);

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

  if (!app || forceRemount) {
    if (forceRemount && app) {
      await teardown(rootElement);
      app = undefined;
    }
    // Clear container before mounting new app
    hostElement.innerHTML = '';

    const mergedProps = { ...parameters?.args, ...args, ...story.props };

    const aureliaApp = appBootstrapFn(
      story,
      mergedProps,
      hostElement,
      component as Constructable
    );
    await aureliaApp.start();
    appMap.set(rootElement, aureliaApp);
    app = aureliaApp;
  } else {
    // update existing app props
    const mergedProps = { ...parameters?.args, ...args, ...story.props };
    if (app?.root?.controller?.viewModel) {
      Object.assign(app.root.controller.viewModel, mergedProps);
    }
  }

  // Return cleanup fn
  return async () => {
    await teardown(rootElement);
  };
}

export function createAureliaApp(
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
      name: 'sb-app',
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