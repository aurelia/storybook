## [3.0.0](https://github.com/aurelia/storybook/compare/v2.3.0...v3.0.0) (2026-08-06)

This release rebuilds the renderer on Storybook's official framework contracts. Stories now
get autodocs, controls derived from bindables, portable stories, CSF Factories, and `mount`
support in play functions.

### ⚠ BREAKING CHANGES

* **exports:** `framework`, `frameworkOptions`, `aureliaFramework`, and `externals` are no
  longer exported from the package root. Configure the framework in `.storybook/main.ts` via
  `defineMain` (or a plain `framework: { name: '@aurelia/storybook' }`) instead.
* **types:** `AureliaRenderContext` was removed. Import `RenderContext` from
  `storybook/internal/types` and parameterise it with `AureliaRenderer`.
* **exports:** `@aurelia/storybook/preview/types` and `@aurelia/storybook/preview/storybook-types`
  are now type-only subpaths. The `types-runtime.js` and `storybook-types-runtime.js` shims were
  deleted, so these specifiers can no longer be imported for a runtime value.
* **preview:** `preview/storybook-types` no longer declares its own structural `Renderer`,
  `StoryContext`, `RenderContext`, and `ArgsStoryFn`. It re-exports Storybook's real types and is
  deprecated — import from `storybook/internal/types` directly.
* **render:** the generated story host element is now `<sb-aurelia-story>` and is no longer
  `containerless`. Previously the wrapper was `<sb-app containerless>` and left no element in the
  DOM. CSS selectors, `:scope >` rules, and DOM snapshots that assumed the component was a direct
  child of the canvas need updating.
* **render:** when a story renders a component without an explicit template, only bindables that
  are actually present in the story props are bound. Previously every bindable on the definition
  was emitted into the generated template, which forced `undefined` over defaults.
* **deps:** `@aurelia/runtime-html` was dropped from `peerDependencies` and `@aurelia/runtime` is
  now a direct dependency. `@aurelia/vite-plugin`, `@aurelia/webpack-loader`, and `ts-loader` were
  added as optional peers.
* **deps:** minimum peer versions raised to `storybook@^10.5.6`, `aurelia@^2.0.0-rc.2`,
  `@storybook/builder-vite@^10.5.6`, `@storybook/builder-webpack5@^10.5.6`, and
  `storybook-builder-rsbuild@^3.4.0`.
* **preset:** the Vite builder now registers `@aurelia/vite-plugin` automatically when no Aurelia
  plugin is present in the config. Projects using the Vite builder must have `@aurelia/vite-plugin`
  installed or `viteFinal` throws. Configs that already add the plugin themselves are left alone.
* **preset:** `previewAnnotations` changed from a static `['./preview.js']` array to an async
  function that resolves absolute paths and conditionally appends the docs annotations. Presets
  that spread or index the old array will break.
* **engines:** the supported Node range is now `^20.19.0 || >=22.12.0`. The previous
  `>=20.19.0 || >=22.12.0` accidentally admitted Node 21.
* **package:** the stale root-level `preset.js` was removed from the published `files` list.

### Features

* **csf-factories:** add Storybook's CSF Factories API — `definePreview`, `preview.meta()`, and
  `meta.story()` with Aurelia-aware arg inference from component bindables and decorators
* **node:** add the `@aurelia/storybook/node` subpath exporting `defineMain` plus `StorybookConfig`,
  `FrameworkName`, `BuilderName`, and `FrameworkOptions` for a typed `.storybook/main.ts`
* **portable-stories:** add the `@aurelia/storybook/portable-stories` subpath with `composeStory`,
  `composeStories`, `setProjectAnnotations`, and `aureliaProjectAnnotations` for reusing stories in
  Vitest and other test runners
* **mount:** add `mount` so play functions can render and await a story before asserting, with
  support for overriding the template, props, and registrations at mount time
* **docs:** add the `preview-docs` entry point with a `sourceDecorator` that emits real Aurelia
  markup as dynamic docs source, so autodocs shows the template rather than a serialised object
* **argtypes:** derive controls and the `bindables` docs table from the component's Aurelia bindable
  definitions via `extractArgTypes`, and read descriptions via `extractComponentDescription`
* **render:** add a `setup()` hook that runs against every Aurelia instance before `start()` and
  returns a disposer
* **types:** export the standard CSF types — `Meta`, `StoryObj`, `StoryFn`, `Decorator`, `Loader`,
  `Preview`, `StoryContext`, `Args`, and `StrictArgs` — resolved against `AureliaRenderer`
* **render:** accept a bare template string or a custom element class as a story result, alongside
  the existing result object
* **types:** add a `register` alias on story results to match the `components` and `items` contracts

### Bug Fixes

* **render:** serialise render and teardown per canvas element so a remount triggered while a
  previous render is still in flight no longer interleaves and leaves a half-mounted app
* **render:** track mounted apps in a `WeakMap` instead of a `Map`, so detached canvas elements are
  no longer retained for the lifetime of the preview iframe
* **render:** dispose on teardown via `stop(true)` and clear the host `refs`, fixing remounts that
  failed because a stopped `AppRoot` still owned its host controller
* **render:** clear props that disappear between arg updates instead of leaving the previous value
  on the view model, and await `tasksSettled()` so assertions see a settled DOM
* **render:** decide remounts from a full render signature — template, component, inner HTML,
  container, registrations, configure hooks, setup functions, and binding keys — rather than the
  story id alone, so changing registrations or hooks correctly forces a fresh app
* **render:** report story and bootstrap errors through `showException`/`showError` and clean up the
  partially started app, instead of letting the rejection escape into Storybook's renderer
* **preset:** exclude and dedupe the full set of Aurelia runtime packages in Vite, not just
  `@aurelia/runtime-html`, fixing duplicate-runtime and metadata resolution failures
* **preset:** skip injecting the Aurelia Vite plugin when running under Vitest, where the consuming
  project already supplies it and a second copy transforms convention templates twice
* **preset:** compare rules by their resolved loader names so object-form `use` entries dedupe
  correctly instead of collapsing to `[object Object]`
* **render:** deduplicate registrations across parameters and story results, and never re-register
  the story's own component

### Build System

* **test:** migrate the test suite from Jest to Vitest and add coverage for the argtypes, CSF
  factories, mount, node, portable stories, and docs entry points
* **repo:** adopt npm workspaces for the example apps and drop their individual lockfiles and
  `.npmrc` files
* **lint:** add a flat ESLint config covering `src`, `__tests__`, `scripts`, and the build configs
* **build:** clean `dist` before each build, emit declarations for the new entry points, and run the
  build from `prepack`
* **ci:** add a static Storybook smoke test (`scripts/smoke-storybooks.mjs`) over all three example
  apps
* **deps:** upgrade to TypeScript 6, Vite 8, Rollup 4.62, and Storybook 10.5.6, and refresh the
  example apps onto `defineMain`/`definePreview`

## [2.3.0](https://github.com/aurelia/storybook/compare/v2.2.1...v2.3.0) (2026-06-02)

### Features

* **package:** update storybook and deps ([a79e567](https://github.com/aurelia/storybook/commit/a79e5674fe13b8ebe0eb6542d03f4b6742196ff9))

## [2.2.1](https://github.com/aurelia/storybook/compare/2.1.0...2.2.1) (2026-01-23)

### Features

* **storybook:** update packages, tooling, rsbuild support ([3a97a99](https://github.com/aurelia/storybook/commit/3a97a9950693183b5880756a943e620895f9457b))
