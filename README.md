# @aurelia/storybook

`@aurelia/storybook` runs Aurelia 2 components inside Storybook 10. It provides the renderer, builder presets, CSF types, bindable controls, docs support, portable stories, and test integration expected from a first-class Storybook framework.

The framework works with Vite, Webpack 5, and Rsbuild/Rspack. You set `component` in the story metadata and write normal Storybook stories; there is no renderer boilerplate in `.storybook/preview.ts`.

## Compatibility

| Part | Supported version |
| --- | --- |
| Aurelia | `2.0.0-rc.2` |
| Storybook | `10.5.x` |
| Node.js | `^20.19.0` or `>=22.12.0` |
| Vite builder | Vite `7.x` or `8.x` and `@storybook/builder-vite` `10.5.x` |
| Webpack builder | `@storybook/builder-webpack5` `10.5.x` |
| Rsbuild builder | Rsbuild `2.x` and `storybook-builder-rsbuild` `3.4.x` |

Aurelia `2.0.0-rc.2` supports Vite 8's Oxc pipeline, including TC39 decorators. No extra Babel or SWC configuration is required.

## What works

- CSF 3 and typed CSF Factories with decorators, loaders, globals, tags, story extension, and `run`
- automatic component rendering with bindables mapped to Storybook args and controls
- actions and interaction tests through `storybook/test`
- play-function `mount`
- autodocs, MDX, bindable arg types, component descriptions, and dynamic Aurelia source markup
- story-level and global Aurelia resources, DI registrations, containers, and setup hooks
- live arg updates without restarting the Aurelia app; structural changes remount cleanly
- portable stories through `composeStory`, `composeStories`, and `setProjectAnnotations`
- Vite, Webpack 5, and Rsbuild/Rspack development and static builds
- Storybook's Vitest addon running real Chromium tests

## Install

Start with the command for your builder. An existing Aurelia app will usually have the Aurelia builder plugin or loader already.

### Vite

```bash
npm install --save-dev @aurelia/storybook storybook @storybook/builder-vite @aurelia/vite-plugin
```

Vite 7 and Vite 8 are supported. With Vite 8, use `@aurelia/vite-plugin` `2.0.0-rc.2` or newer.

### Webpack 5

```bash
npm install --save-dev @aurelia/storybook storybook @storybook/builder-webpack5 @aurelia/webpack-loader ts-loader
```

### Rsbuild/Rspack

```bash
npm install --save-dev @aurelia/storybook storybook storybook-builder-rsbuild @rsbuild/core @aurelia/webpack-loader
```

Add `@storybook/addon-docs`, `@storybook/addon-a11y`, and other addons as needed.

## Configure Storybook

For Vite, create `.storybook/main.ts`:

```ts
import { defineMain } from '@aurelia/storybook/node';

export default defineMain({
  stories: ['../src/**/*.@(mdx|stories.@(ts|js))'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: {
    name: '@aurelia/storybook',
    options: {},
  },
  core: {
    builder: '@storybook/builder-vite',
  },
});
```

The framework preset adds the Aurelia Vite plugin when the Storybook config does not already have it. It also keeps Aurelia's runtime packages out of Vite dependency pre-bundling so the renderer and components use one runtime instance.

Webpack uses the same file with a different builder:

```ts
core: {
  builder: '@storybook/builder-webpack5',
},
```

The preset adds `ts-loader` and `@aurelia/webpack-loader` rules once, preserving any rules already in the config.

For Rsbuild, use:

```ts
core: {
  builder: 'storybook-builder-rsbuild',
},
```

The Rsbuild preset adds the matching Aurelia Rspack rules.

Your `.storybook/preview.ts` carries project settings and addon types:

```ts
import { definePreview } from '@aurelia/storybook';
import addonA11y from '@storybook/addon-a11y';
import addonDocs from '@storybook/addon-docs';

export default definePreview({
  addons: [addonA11y(), addonDocs()],
  tags: ['autodocs'],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
});
```

Do not export `render` or `renderToCanvas` from the preview file. Storybook loads them from the framework preset.

The factory form above enables Storybook's typed `preview.meta` and `meta.story` APIs. A regular object using `satisfies Preview` remains supported for CSF 3 projects.

Add the usual scripts:

```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

## Write stories

Storybook's CSF Factories API infers the Aurelia component instance, addon parameters, decorators, and story args:

```ts
import preview from '../../.storybook/preview';
import { expect, fn, userEvent } from 'storybook/test';
import { HelloWorld } from '../hello-world';

const meta = preview.meta({
  title: 'Example/HelloWorld',
  component: HelloWorld,
  args: {
    message: 'Hello from Storybook',
    onIncrement: fn(),
  },
});

export const Default = meta.story({
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Increment' }));
    await expect(args.onIncrement).toHaveBeenCalledWith(1);
  },
});

export const Renamed = Default.extend({
  args: { message: 'Extended story' },
});
```

Factory stories also expose Storybook's composed metadata, `run`, `extend`, and test APIs. CSF 3 remains available when a project prefers object exports.

Automatic rendering covers the common case:

```ts
import type { Meta, StoryObj } from '@aurelia/storybook';
import { fn, userEvent, within } from 'storybook/test';
import { HelloWorld } from '../hello-world';

const meta = {
  title: 'Example/HelloWorld',
  component: HelloWorld,
  args: {
    message: 'Hello from Storybook',
    onIncrement: fn(),
  },
  argTypes: {
    message: { control: 'text' },
    onIncrement: { action: 'increment' },
  },
} satisfies Meta<typeof HelloWorld>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;

export const Interaction = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Increment' }));
  },
} satisfies Story;
```

The generated Aurelia template binds only the args that are present. Omitted bindables keep the component's own default values. Adding or removing a bindable arg remounts the generated template; changing an existing value updates the running view model.

### Custom templates and projected content

Use `defineAureliaStory` when the component needs specific markup, local resources, or projected content:

```ts
import {
  defineAureliaStory,
  type Meta,
  type StoryObj,
} from '@aurelia/storybook';
import { CardHeading } from '../card-heading';
import { ProductCard } from '../product-card';

const meta = {
  component: ProductCard,
} satisfies Meta<typeof ProductCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Detailed = {
  render: (args) =>
    defineAureliaStory({
      template: `
        <product-card product.bind="product">
          <card-heading>Featured</card-heading>
        </product-card>
      `,
      props: args,
      register: [ProductCard, CardHeading],
    }),
  args: {
    product: { name: 'Desk lamp' },
  },
} satisfies Story;
```

A story result can contain:

| Field | Purpose |
| --- | --- |
| `template` | Aurelia markup for the story |
| `Component` | component override for this story |
| `props` | values merged after Storybook args |
| `innerHtml` | projected markup for an automatically generated component element |
| `register` or `components` | custom elements, attributes, value converters, plugins, and other registries |
| `items` | DI registrations and services |
| `container` | an existing Aurelia container |

The render function may also return a template string or an Aurelia custom-element class directly.

### Aurelia configuration

Register resources for a preview, component group, or individual story with `parameters.aurelia`:

```ts
import { Registration } from 'aurelia';
import type { Preview } from '@aurelia/storybook';
import { FeatureFlags } from '../src/feature-flags';
import { MoneyValueConverter } from '../src/money-value-converter';

const preview = {
  parameters: {
    aurelia: {
      register: [MoneyValueConverter],
      configureContainer: (container) => {
        container.register(
          Registration.instance(FeatureFlags, { newCheckout: true })
        );
      },
      configure: (aurelia, context) => {
        // Configure the app before it starts.
      },
    },
  },
} satisfies Preview;

export default preview;
```

For package-wide setup, use `setup` from `.storybook/preview.ts`:

```ts
import { setup } from '@aurelia/storybook';

setup(async (aurelia, context) => {
  // Runs for every newly mounted story app.
});
```

`setup` returns an unregister function, which is useful in test environments.

### Mount from a play function

Destructure `mount` when a play function controls the initial render:

```ts
import { expect } from 'storybook/test';

export const MountedByPlay = {
  play: async ({ mount }) => {
    const canvas = await mount({
      Component: HelloWorld,
      props: { message: 'Mounted from play' },
    });

    await expect(canvas.getByText('Mounted from play')).toBeVisible();
  },
};
```

Storybook detects the destructured parameter and waits for this mount before running post-story checks.

## Docs and MDX

Add `@storybook/addon-docs` to enable autodocs and MDX. Aurelia bindables appear under a `bindables` category, and dynamic source blocks show the Aurelia markup used by the story. Set `parameters.docs.source.code` when a story needs a hand-written source example.

Regular Storybook MDX works without an Aurelia-specific wrapper:

```mdx
import { Meta, Canvas } from '@storybook/addon-docs/blocks';
import * as Stories from './hello-world.stories';

<Meta of={Stories} />

# Hello World

<Canvas of={Stories.Default} />
```

## Vitest browser tests

Storybook's Vitest addon can run the same stories in Chromium. Extend the app's Vite config so the test project receives exactly one Aurelia plugin instance:

```ts
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    projects: [
      {
        extends: './vite.config.ts',
        plugins: [
          storybookTest({ configDir: path.join(dirname, '.storybook') }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
```

Do not add another `aurelia()` call to this project when the extended Vite config already has it. Transforming Aurelia convention templates twice turns the first generated module into template text.

With Vite 8 and a factory preview, pre-bundle the addon entry points imported by that preview. This prevents Vite from reloading the first browser-test run while it discovers them:

```ts
optimizeDeps: {
  include: [
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@storybook/addon-vitest',
    'storybook/internal/csf',
  ],
},
```

## Portable stories

The package exports Aurelia-aware portable-story helpers:

```ts
import { composeStories } from '@aurelia/storybook/portable-stories';
import * as stories from './hello-world.stories';

const { Default } = composeStories(stories);

await Default.run();
```

When `.storybook/preview.ts` exports a CSF 3 configuration object, use `setProjectAnnotations` once in a test setup file so portable stories receive it:

```ts
import { setProjectAnnotations } from '@aurelia/storybook/portable-stories';
import preview from '../.storybook/preview';

setProjectAnnotations(preview);
```

CSF Factory stories already carry their preview annotations. Import one and call `await Story.run()` directly instead of composing it again.

## Development

This repository is an npm workspace containing the framework and Vite, Webpack, and Rsbuild examples.

```bash
npm ci
npm run sync:versions:check
npm run lint
npm run typecheck
npm test
npm run build
npm run lint:examples
npm run typecheck:examples
npm run test:examples
npm run build:examples
npm run build:storybooks
npm run test:storybook
```

`npm run test:storybook` requires a Chromium binary. Install it with `npx playwright install chromium` if Playwright has not already done so.

## License

MIT
