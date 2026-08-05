# Rsbuild/Rspack example

This workspace exercises `@aurelia/storybook` with Aurelia 2 and `storybook-builder-rsbuild`. The app itself remains a small Vite fixture; Storybook uses Rsbuild/Rspack so the framework's Rspack loader rules, docs, accessibility checks, controls, and interactions are covered independently.

Run commands from the repository root:

```bash
npm run start --workspace @aurelia/storybook-example-rsbuild
npm run storybook --workspace @aurelia/storybook-example-rsbuild
npm run build --workspace @aurelia/storybook-example-rsbuild
npm run build-storybook --workspace @aurelia/storybook-example-rsbuild
npm run test:unit --workspace @aurelia/storybook-example-rsbuild
```

The Storybook dev server uses port 6008.
