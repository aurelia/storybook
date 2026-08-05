import Aurelia, { CustomElement, refs, type Constructable } from 'aurelia';
import { tasksSettled } from '@aurelia/runtime';
import type {
  ArgsStoryFn,
  RenderContext,
} from 'storybook/internal/types';
import type {
  AureliaComponent,
  AureliaParameters,
  AureliaRenderer,
  AureliaSetup,
  AureliaStoryContext,
  AureliaStoryFnResult,
  AureliaStoryResult,
} from './types';

interface AureliaAppLike {
  container?: unknown;
  root?: { controller?: { viewModel?: Record<string, unknown> } };
  start: () => void | Promise<void>;
  stop: (dispose?: boolean) => void | Promise<void>;
}

interface RenderSignature {
  id: string;
  template?: string;
  component?: AureliaComponent;
  innerHtml?: string;
  container?: unknown;
  registrations: unknown[];
  configureContainer?: AureliaParameters['configureContainer'];
  configure?: AureliaParameters['configure'];
  setupFunctions: AureliaSetup[];
  bindingKeys: string[];
}

interface MountedAureliaApp {
  app: AureliaAppLike;
  host: HTMLElement;
  props: Set<string>;
  signature: RenderSignature;
}

const mountedApps = new WeakMap<HTMLElement, MountedAureliaApp>();
const setupFunctions = new Set<AureliaSetup>();

const noop = () => undefined;
const canvasOperations = new WeakMap<HTMLElement, Promise<unknown>>();

async function enqueueCanvasOperation<T>(
  canvasElement: HTMLElement,
  operation: () => T | Promise<T>
): Promise<T> {
  const previous = canvasOperations.get(canvasElement) ?? Promise.resolve();
  const current = previous.catch(noop).then(operation);
  canvasOperations.set(canvasElement, current);

  try {
    return await current;
  } finally {
    if (canvasOperations.get(canvasElement) === current) {
      canvasOperations.delete(canvasElement);
    }
  }
}

export function setup(callback: AureliaSetup): () => void {
  setupFunctions.add(callback);
  return () => setupFunctions.delete(callback);
}

function getAureliaParameters(
  storyContext?: AureliaStoryContext
): AureliaParameters | undefined {
  const parameters = storyContext?.parameters?.aurelia;
  return parameters && typeof parameters === 'object'
    ? (parameters as AureliaParameters)
    : undefined;
}

function uniqueResources(resources: unknown[]): unknown[] {
  return [...new Set(resources.filter(Boolean))];
}

function collectRegistrations(
  story: AureliaStoryResult,
  parameters: AureliaParameters | undefined,
  component: AureliaComponent | undefined
): unknown[] {
  return uniqueResources([
    ...(parameters?.register ?? []),
    ...(parameters?.components ?? []),
    ...(parameters?.items ?? []),
    ...(story.register ?? []),
    ...(story.components ?? []),
    ...(story.items ?? []),
  ]).filter((resource) => resource !== component);
}

function mergeStoryProps(
  context: AureliaStoryContext,
  story: AureliaStoryResult
): Record<string, unknown> {
  const legacyParameterArgs = context.parameters?.args;
  return {
    ...(legacyParameterArgs && typeof legacyParameterArgs === 'object'
      ? legacyParameterArgs
      : {}),
    ...context.args,
    ...story.props,
  };
}

function normalizeStoryResult(
  result: AureliaStoryFnResult | null | undefined
): AureliaStoryResult | undefined {
  if (typeof result === 'string') {
    return { template: result };
  }
  if (typeof result === 'function' && CustomElement.isType(result)) {
    return { Component: result as AureliaComponent };
  }
  if (result && typeof result === 'object') {
    return result;
  }
  return undefined;
}

function sameReferences(left: unknown[], right: unknown[]): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function sameSignature(left: RenderSignature, right: RenderSignature): boolean {
  return (
    left.id === right.id &&
    left.template === right.template &&
    left.component === right.component &&
    left.innerHtml === right.innerHtml &&
    left.container === right.container &&
    left.configureContainer === right.configureContainer &&
    left.configure === right.configure &&
    sameReferences(left.registrations, right.registrations) &&
    sameReferences(left.setupFunctions, right.setupFunctions) &&
    sameReferences(left.bindingKeys, right.bindingKeys)
  );
}

function resolveHost(canvasElement: HTMLElement): HTMLElement {
  if (canvasElement.id !== 'storybook-root') {
    return canvasElement;
  }

  let host = canvasElement.querySelector<HTMLElement>(
    ':scope > .aurelia-story-container'
  );
  if (!host) {
    host = document.createElement('div');
    host.className = 'aurelia-story-container';
    host.style.height = '100%';
    canvasElement.append(host);
  }
  return host;
}

async function stopApp(app: AureliaAppLike | undefined): Promise<void> {
  if (app?.stop) {
    // A stopped AppRoot still owns its host controller unless it is disposed.
    // Storybook reuses the same canvas host across toolbar-triggered remounts.
    await app.stop(true);
  }
}

async function teardown(
  canvasElement: HTMLElement,
  expected?: AureliaAppLike
): Promise<void> {
  const mounted = mountedApps.get(canvasElement);
  if (!mounted || (expected && mounted.app !== expected)) {
    return;
  }

  mountedApps.delete(canvasElement);
  try {
    await stopApp(mounted.app);
  } finally {
    refs.clear(mounted.host);
    mounted.host.replaceChildren();
  }
}

function reportException(
  context: RenderContext<AureliaRenderer>,
  error: unknown
): void {
  const exception = error instanceof Error ? error : new Error(String(error));
  if (typeof context.showException === 'function') {
    context.showException(exception);
    return;
  }
  context.showError({ title: exception.name, description: exception.message });
}

function updateViewModel(
  mounted: MountedAureliaApp,
  nextProps: Record<string, unknown>
): void {
  const viewModel = mounted.app.root?.controller?.viewModel;
  if (!viewModel) {
    throw new Error('The running Aurelia story has no root view model to update.');
  }

  for (const key of mounted.props) {
    if (!(key in nextProps)) {
      viewModel[key] = undefined;
    }
  }
  Object.assign(viewModel, nextProps);
  mounted.props = new Set(Object.keys(nextProps));
}

export const render: ArgsStoryFn<AureliaRenderer> = (args, context) => {
  const Component = context.component;
  if (!Component) {
    const label = context.title && context.name
      ? `${context.title} / ${context.name}`
      : context.id;
    throw new Error(
      `Unable to render ${label}: add a component to the default export or provide a story render function.`
    );
  }
  return { Component, props: args };
};

async function performRenderToCanvas(
  context: RenderContext<AureliaRenderer>,
  canvasElement: HTMLElement,
  bootstrapApp: typeof createAureliaApp = createAureliaApp
): Promise<() => Promise<void> | void> {
  const host = resolveHost(canvasElement);
  let story: AureliaStoryResult | undefined;

  try {
    story = normalizeStoryResult(context.storyFn());
  } catch (error) {
    reportException(context, error);
    return noop;
  }

  if (!story) {
    context.showError({
      title: `Nothing was returned by ${context.title} / ${context.name}.`,
      description:
        'Return Aurelia markup, a custom element, or an object with a template or Component.',
    });
    return noop;
  }

  const component = (story.Component ??
    context.storyContext.component) as AureliaComponent | undefined;
  if (story.template == null && !component) {
    context.showError({
      title: `No Aurelia template or component was provided by ${context.title} / ${context.name}.`,
      description:
        'Add a component to the default export, or return an object with template or Component.',
    });
    return noop;
  }

  const parameters = getAureliaParameters(context.storyContext);
  const props = mergeStoryProps(context.storyContext, story);
  const signature: RenderSignature = {
    id: context.id,
    template: story.template,
    component,
    innerHtml: story.innerHtml,
    container: story.container,
    registrations: collectRegistrations(story, parameters, component),
    configureContainer: parameters?.configureContainer,
    configure: parameters?.configure,
    setupFunctions: [...setupFunctions],
    bindingKeys:
      story.template == null && component
        ? getComponentBindingKeys(component, props)
        : [],
  };
  const mounted = mountedApps.get(canvasElement);
  const shouldRemount =
    !mounted || context.forceRemount || !sameSignature(mounted.signature, signature);

  if (!shouldRemount && mounted) {
    try {
      updateViewModel(mounted, props);
      await tasksSettled();
      context.showMain();
      return () => teardown(canvasElement, mounted.app);
    } catch (error) {
      await teardown(canvasElement, mounted.app);
      reportException(context, error);
      return noop;
    }
  }

  if (mounted) {
    await teardown(canvasElement, mounted.app);
  }
  host.replaceChildren();

  let app: AureliaAppLike | undefined;
  try {
    app = bootstrapApp(
      story,
      props,
      host,
      component,
      context.storyContext
    );
    for (const configure of signature.setupFunctions) {
      await configure(app as Aurelia, context.storyContext);
    }
    await app.start();
    await tasksSettled();
    mountedApps.set(canvasElement, {
      app,
      host,
      props: new Set(Object.keys(props)),
      signature,
    });
    context.showMain();
  } catch (error) {
    try {
      await stopApp(app);
    } finally {
      host.replaceChildren();
    }
    reportException(context, error);
    return noop;
  }

  const appForCleanup = app;
  return () => teardown(canvasElement, appForCleanup);
}

export async function renderToCanvas(
  context: RenderContext<AureliaRenderer>,
  canvasElement: HTMLElement,
  bootstrapApp: typeof createAureliaApp = createAureliaApp
): Promise<() => Promise<void>> {
  const cleanup = await enqueueCanvasOperation(canvasElement, () =>
    performRenderToCanvas(context, canvasElement, bootstrapApp)
  );
  return () =>
    enqueueCanvasOperation(canvasElement, async () => {
      await cleanup();
    });
}

export function createAureliaApp(
  story: AureliaStoryResult,
  args: Record<string, unknown>,
  domElement: HTMLElement,
  component?: Constructable,
  storyContext?: AureliaStoryContext
): AureliaAppLike {
  const aurelia = new Aurelia(story.container);
  const parameters = getAureliaParameters(storyContext);

  parameters?.configureContainer?.(aurelia.container, storyContext!);

  const register = (resource: unknown) => {
    if (CustomElement.isType(resource)) {
      const definition = CustomElement.getDefinition(resource);
      if (aurelia.container.has(definition.key, false)) {
        return;
      }
    }
    aurelia.register(resource);
  };

  for (const resource of collectRegistrations(story, parameters, component)) {
    register(resource);
  }

  let template = story.template;
  if (component) {
    template ??= createComponentTemplate(component, story.innerHtml, args);
    register(component);
  }

  const StoryHost = CustomElement.define(
    {
      name: 'sb-aurelia-story',
      template: template ?? '',
    },
    class {}
  );
  const viewModel = Object.assign(new StoryHost(), args);

  parameters?.configure?.(aurelia, storyContext!);

  return aurelia.app({ host: domElement, component: viewModel }) as AureliaAppLike;
}

export function createComponentTemplate(
  component: Constructable,
  innerHtml?: string,
  props?: Record<string, unknown>
): string {
  const definition = CustomElement.getDefinition(component);
  const bindings = Object.values(definition.bindables ?? {})
    .filter(
      (bindable) =>
        props == null || Object.prototype.hasOwnProperty.call(props, bindable.name)
    )
    .map((bindable) => `${bindable.attribute}.bind="${bindable.name}"`)
    .join(' ');
  return `<${definition.name}${bindings ? ` ${bindings}` : ''}>${innerHtml ?? ''}</${definition.name}>`;
}

function getComponentBindingKeys(
  component: Constructable,
  props: Record<string, unknown>
): string[] {
  const definition = CustomElement.getDefinition(component);
  return Object.values(definition.bindables ?? {})
    .filter((bindable) => Object.prototype.hasOwnProperty.call(props, bindable.name))
    .map((bindable) => bindable.name)
    .sort();
}

export { normalizeStoryResult };
