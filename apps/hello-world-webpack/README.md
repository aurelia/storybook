# Webpack example

This workspace exercises `@aurelia/storybook` with Aurelia 2 and Storybook's Webpack 5 builder. It covers the framework's automatic TypeScript and Aurelia template-loader rules as well as docs, accessibility, controls, and interaction stories.

Run commands from the repository root:

```bash
npm run start --workspace @aurelia/storybook-example-webpack
npm run storybook --workspace @aurelia/storybook-example-webpack
npm run build --workspace @aurelia/storybook-example-webpack
npm run build-storybook --workspace @aurelia/storybook-example-webpack
```

The Storybook dev server uses port 6007. The application build writes to `apps/hello-world-webpack/dist`.
