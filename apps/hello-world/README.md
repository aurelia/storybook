# Vite example

This workspace exercises `@aurelia/storybook` with Aurelia 2, Vite, Storybook's Vite builder, autodocs, MDX, accessibility checks, interaction tests, and portable play-function mounting.

Run commands from the repository root:

```bash
npm run start --workspace @aurelia/storybook-example-vite
npm run storybook --workspace @aurelia/storybook-example-vite
npm run build --workspace @aurelia/storybook-example-vite
npm run build-storybook --workspace @aurelia/storybook-example-vite
npm run test:unit --workspace @aurelia/storybook-example-vite
npm run test-storybook --workspace @aurelia/storybook-example-vite
```

The Storybook dev server uses port 6006. The browser test command runs every story in headless Chromium and includes the configured accessibility checks.
