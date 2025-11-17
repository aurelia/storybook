# @aurelia/storybook

> **Note:** Storybook support is still early-stage. Expect a few rough edges while Aurelia 2 finishes its beta cycle, and please report anything that feels off.

`@aurelia/storybook` is the glue between Aurelia 2 components and Storybook 10. It wires Aurelia's `enhance()` API into Storybook's rendering pipeline so you can preview, test, and document your components with either the Vite or Webpack builders.

## Compatibility at a Glance

| Item | Supported versions | Notes |
| --- | --- | --- |
| Storybook | 10.x (ESM) | Tested with 10.0.5+; works with `storybook dev`/`storybook build` commands. |
| Aurelia | 2.0.0-beta.25+ | Uses Aurelia's `enhance()` APIs under the hood. |
| Bundlers | `@storybook/builder-vite` (Vite 5) · `@storybook/builder-webpack5` | Pick whichever matches your app; both share the same Aurelia preview runtime. |
| Node.js | ≥ 20.19.0 or ≥ 22.12.0 | Matches the engines field in `package.json` and Storybook 10's baseline.

## Requirements

- An Aurelia 2 application (TypeScript or JavaScript) already set up with either Vite or Webpack.
- Storybook 10.x installed in the project. (Run `npx storybook@latest init` if you are starting fresh.)
- The peer dependencies listed in [`package.json`](package.json) that align with the Aurelia 2 beta train you are targeting.

## Installation

```bash
npm install --save-dev @aurelia/storybook storybook @storybook/builder-vite
# or, for Webpack builds:
npm install --save-dev @aurelia/storybook storybook @storybook/builder-webpack5
```

Add whichever addons you need (`@storybook/addon-links`, `@storybook/addon-actions`, etc.). Essentials functionality now ships with Storybook 10 core, so most projects only add optional extras.

---

## Quick Start (Vite Builder)

1. **Install** the dev dependencies as shown above (or with `pnpm`/`yarn`).
2. **Create `.storybook/main.ts`:**

   ```ts
   // .storybook/main.ts
   import { mergeConfig, type InlineConfig } from 'vite';
   import type { StorybookConfig } from 'storybook/internal/types';

   const config: StorybookConfig & { viteFinal?: (config: InlineConfig) => InlineConfig | Promise<InlineConfig> } = {
     stories: ['../src/stories/**/*.stories.@(ts|tsx|js|jsx|mdx)'],
     addons: ['@storybook/addon-links'],
     framework: {
       name: '@aurelia/storybook',
       options: {},
     },
     core: {
       builder: '@storybook/builder-vite',
     },
     viteFinal: async (viteConfig) => {
       // Ensure problematic Aurelia deps are excluded from pre-bundling.
       viteConfig.optimizeDeps = viteConfig.optimizeDeps ?? {};
       viteConfig.optimizeDeps.exclude = Array.from(new Set([...(viteConfig.optimizeDeps.exclude ?? []), '@aurelia/runtime-html']));

       return mergeConfig(viteConfig, {
         define: {
           'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'development'),
         },
       });
     },
   };

   export default config;
   ```

   - Excluding `@aurelia/runtime-html` keeps Vite from trying to pre-bundle Aurelia's DOM runtime, which is already ESM friendly.
   - The `define` shim avoids `process is not defined` errors when Storybook code (or Aurelia plugins) look for `process.env.NODE_ENV` in the preview iframe.

3. **Create `.storybook/preview.ts`:**

   ```ts
   // .storybook/preview.ts
   export { render, renderToCanvas } from '@aurelia/storybook';
   ```

4. **Add `storybook` scripts** to `package.json`:

   ```json
   {
     "scripts": {
       "storybook": "storybook dev -p 6006",
       "build-storybook": "storybook build"
     }
   }
   ```

5. **Run Storybook:** `npm run storybook` starts the dev server at http://localhost:6006.

## Quick Start (Webpack Builder)

1. Install `@storybook/builder-webpack5` instead of the Vite builder.
2. Create `.storybook/main.ts`:

   ```ts
   import type { StorybookConfig } from 'storybook/internal/types';

   const config: StorybookConfig = {
     stories: ['../src/**/*.stories.@(ts|tsx|js|jsx|mdx)'],
     addons: ['@storybook/addon-links'],
     framework: {
       name: '@aurelia/storybook',
       options: {},
     },
     core: {
       builder: '@storybook/builder-webpack5',
     },
   };

   export default config;
   ```

   The preset embedded in this package injects the `ts-loader` + `@aurelia/webpack-loader` rules so you typically do not need extra config, but `webpackFinal` is available if you need to extend it further.

3. Reuse the same `.storybook/preview.ts` and `package.json` scripts as in the Vite quick start.

---

## Writing Aurelia Stories

Story files look exactly like standard Storybook CSF stories. The framework export automatically:

- Registers the component you set on the default export.
- Uses `renderToCanvas` to bootstrap an Aurelia app inside Storybook's preview iframe.
- Generates a template for you if you omit the `render` function (it binds every declared `bindable`).

```ts
// src/stories/hello-world.stories.ts
import { HelloWorld } from '../hello-world';
import { fn, userEvent, within } from 'storybook/test';

const meta = {
  title: 'Example/HelloWorld',
  component: HelloWorld,
  render: () => ({
    template: `<hello-world message.bind="message" on-increment.bind="onIncrement"></hello-world>`,
  }),
  argTypes: {
    message: { control: 'text' },
    onIncrement: { action: 'increment' },
  },
};

export default meta;

export const DefaultHelloWorld = {
  args: {
    message: 'Hello from Storybook!',
    onIncrement: fn(),
  },
};

export const InteractiveHelloWorld = {
  args: {
    message: 'Try clicking the button!',
    onIncrement: fn(),
  },
  async play({ canvasElement }: { canvasElement: HTMLElement }) {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button'));
  },
};

export const NoArgs = {
  render: () => ({ template: `<hello-world></hello-world>` }),
};

export const WithCustomTemplate = {
  render: () => ({
    template: `<hello-world message.bind="message">Click me!</hello-world>`,
  }),
  args: {
    message: 'This is a custom message',
  },
};
```

### Story Result Contract

When you provide a custom `render` function, return an object with any of the following fields. The Aurelia runtime consumes them while creating the preview app:

| Field | Type | Purpose |
| --- | --- | --- |
| `template` | `string` | Markup that will be enhanced inside Storybook's canvas. Required when you do not rely on the auto-generated template. |
| `components` | `unknown[]` | Additional custom elements, value converters, etc. to register via `aurelia.register(...)`. |
| `items` | `unknown[]` | Any DI registrations (e.g., `Registration.instance(...)`, services, or Aurelia plugins). |
| `container` | `IContainer` | Supply a pre-configured Aurelia DI container if you need full control. |
| `innerHtml` | `string` | Optional projection content used when a component template is auto-generated from the `component` export. |
| `props` | `Record<string, any>` | Story-specific props that merge with Storybook `args`. Useful when you need defaults that should not surface as controls.

## Registering Aurelia Dependencies & DI

Use the `components`, `items`, or `container` fields to bring along everything your component needs:

```ts
import { DI, Registration } from 'aurelia';
import { HttpClient } from '@aurelia/fetch-client';
import { OrdersPanel } from '../orders-panel';

const container = DI.createContainer();
container.register(
  HttpClient,
  Registration.instance('apiBaseUrl', 'https://api.example.com')
);

export const WithServices = {
  render: () => ({
    template: `<orders-panel api-base-url.bind="apiBaseUrl"></orders-panel>`,
    components: [OrdersPanel],
    container,
    props: {
      apiBaseUrl: 'https://api.example.com',
    },
  }),
};
```

Because the Aurelia app lives for the lifetime of the story iframe, DI registrations persist until the story is torn down or Storybook forces a remount. If you need a clean state between stories, set `parameters: { forceRemount: true }` on the story or click the *Remount component* toolbar button in Storybook.

## Example Apps Inside This Repo

- `apps/hello-world` – Vite-based Aurelia starter that consumes `@aurelia/storybook`.
- `apps/hello-world-webpack` – Equivalent Webpack example.

To try them out:

```bash
cd apps/hello-world
npm install
npm run storybook

cd ../hello-world-webpack
npm install
npm run storybook
```

Each sample project now includes a small library of showcase stories you can open in Storybook to see different aspects of the integration:

- `HelloWorld` – the minimal counter example wired to Storybook controls and actions.
- `StatCard` – demonstrates args-driven styling and wiring the `onRefresh` action.
- `NotificationCenter` – renders repeating templates and exercises dismissal actions + play functions.
- `FeedbackForm` – shows two-way bindings, form state, and Storybook interaction tests that fill and submit inputs.
- `WeatherWidget` – uses Aurelia's DI plus `items` registration in the story to provide a mock `WeatherService` implementation.

These are great references when you want to compare your configuration against a working baseline or copy/paste patterns into your own component library.

## Troubleshooting & Tips

- **`process is not defined` inside the preview iframe** – Add `define: { 'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'development') }` in your `viteFinal` merge (shown above).
- **Vite fails while pre-bundling Aurelia packages** – Ensure `@aurelia/runtime-html` (and any other Aurelia libs that re-export DOM globals) are listed in `optimizeDeps.exclude`.
- **State leaks between stories** – By default we reuse the Aurelia app instance for performance. Pass `parameters: { forceRemount: true }` to stories that must start fresh.
- **Need additional Storybook addons?** – Add them to the `addons` array as usual. The Aurelia framework only controls rendering, so controls, actions, interactions, and testing addons all work normally.

## Development

This repository publishes the Storybook framework itself. Helpful scripts:

- `npm run build` – bundle the framework with Rollup.
- `npm run build:types` – emit `.d.ts` files via `tsc`.
- `npm run watch` – development build with Rollup watch mode.
- `npm run test` – run the Jest suite (uses the JSDOM environment).

While developing, you can link the package into one of the sample apps in `apps/` to manual-test Storybook changes end to end.

## Contributing

Bug reports, docs tweaks, and feature PRs are all welcome. Please open an issue to discuss significant changes, and spin up one of the example apps to verify the behavior you are touching.

## License

[MIT](LICENSE)

## Acknowledgements

Special shout out to Dmitry (@ekzobrain on GitHub) for the work he did on Storybook support for earlier versions of Storybook, which helped lay the groundwork for this implementation: [https://github.com/ekzobrain/storybook](https://github.com/ekzobrain/storybook).
