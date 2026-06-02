import type { RenderContext, ArgsStoryFn } from './storybook-types';
import type {
  AureliaRenderer,
  AureliaStoryResult,
  AureliaParameters,
  AureliaStoryContext,
} from './types';
import Aurelia, { Constructable, CustomElement } from 'aurelia';

interface MountedAureliaApp {
  id?: string;
  app: any;
}

const appMap = new Map<HTMLElement, MountedAureliaApp>();

function mergeStoryProps(
  parameters: { args?: Record<string, any> } | undefined,
  storyArgs: Record<string, any> | undefined,
  storyProps: Record<string, any> | undefined
) {
  return { ...parameters?.args, ...storyArgs, ...storyProps };
}

function getAureliaParameters(
  storyContext?: AureliaStoryContext
): AureliaParameters | undefined {
  const parameters = storyContext?.parameters?.aurelia;
  if (!parameters || typeof parameters !== 'object') {
    return undefined;
  }
  return parameters as AureliaParameters;
}

function normalizeRegistrations(
  parameters: AureliaParameters | undefined
): unknown[] {
  if (!parameters) {
    return [];
  }

  const register = Array.isArray(parameters.register) ? parameters.register : [];
  const components = Array.isArray(parameters.components) ? parameters.components : [];
  const items = Array.isArray(parameters.items) ? parameters.items : [];

  return [...register, ...components, ...items].filter(Boolean);
}

async function teardown(element: HTMLElement, expectedApp?: any) {
  const mounted = appMap.get(element);
  if (!mounted) {
    return;
  }

  if (expectedApp && mounted.app !== expectedApp) {
    return;
  }

  appMap.delete(element);

  if (typeof mounted.app?.stop === 'function') {
    await mounted.app.stop();
  }
}

export const render: ArgsStoryFn<AureliaRenderer> = (args, context) => {
  const { id, component: Component } = context;
  
  if (!Component) {
    const label = context.title && context.name ? `${context.title} / ${context.name}` : id;
    throw new Error(
      `Unable to render story ${label} as the component annotation is missing from the default export`
    );
  }
  return { Component, props: args };
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
  const storyId = storyContext.id ?? `${title}--${name}`;
  
  const mounted = appMap.get(rootElement);
  let app = mounted?.app;
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

  if (!component && !story.template) {
    showError({
      title: `Expecting a template or component from the story: "${name}" of "${title}".`,
      description: `
        Provide a component on the default export or return "{ template: '<custom-component></custom-component>' }" from the story.
      `,
    });
    return () => {};
  }

  showMain();

  const shouldRemount = !app || forceRemount || mounted?.id !== storyId;

  if (shouldRemount) {
    if (forceRemount && app) {
      await teardown(rootElement, app);
      app = undefined;
    }
    if (mounted?.id !== storyId && app) {
      await teardown(rootElement, app);
      app = undefined;
    }

    // Clear container before mounting new app
    hostElement.innerHTML = '';

    const mergedProps = mergeStoryProps(parameters, args, story.props);

    const aureliaApp = appBootstrapFn(
      story,
      mergedProps,
      hostElement,
      component as Constructable,
      storyContext
    );
    await aureliaApp.start();
    appMap.set(rootElement, { id: storyId, app: aureliaApp });
    app = aureliaApp;
  } else {
    // update existing app props
    const mergedProps = mergeStoryProps(parameters, args, story.props);
    if (app?.root?.controller?.viewModel) {
      Object.assign(app.root.controller.viewModel, mergedProps);
    }
  }

  // Return cleanup fn
  const appForCleanup = app;
  return async () => {
    await teardown(rootElement, appForCleanup);
  };
}

export function createAureliaApp(
  story: AureliaStoryResult,
  args: Record<string, any>,
  domElement: HTMLElement,
  component?: Constructable,
  storyContext?: AureliaStoryContext
) {
  const aurelia = new Aurelia(story.container);
  const { container } = aurelia;
  const aureliaParameters = getAureliaParameters(storyContext);

  const registerIfNeeded = (resource: unknown) => {
    if (!resource) {
      return;
    }

    if (CustomElement.isType(resource)) {
      const definition = CustomElement.getDefinition(resource);
      if (container.has(definition.key, false)) {
        return;
      }
    }

    aurelia.register(resource);
  };

  const registerAll = (resources?: unknown[]) => {
    if (!resources?.length) {
      return;
    }

    for (const resource of resources) {
      registerIfNeeded(resource);
    }
  };

  if (aureliaParameters?.configureContainer && storyContext) {
    aureliaParameters.configureContainer(container, storyContext);
  }

  registerAll(normalizeRegistrations(aureliaParameters));
  registerAll(story.items);

  const storyComponents = (story.components ?? []).filter(Boolean);
  const dedupedComponents = component
    ? storyComponents.filter((entry) => entry !== component)
    : storyComponents;

  for (const entry of dedupedComponents) {
    registerIfNeeded(entry);
  }

  let { template } = story;

  if (component) {
    template = template ?? createComponentTemplate(component, story.innerHtml);
    registerIfNeeded(component);
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

  if (aureliaParameters?.configure && storyContext) {
    aureliaParameters.configure(aurelia, storyContext);
  }

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

  const bindings = Object.values(def.bindables ?? {})
    .map((bindable) => `${bindable.attribute}.bind="${bindable.name}"`)
    .join(' ');
  const bindingAttributes = bindings ? ` ${bindings}` : '';

  return `<${def.name}${bindingAttributes}>${innerHtml ?? ''}</${def.name}>`;
}
