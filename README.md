# @aurelia/storybook

> **Note:** Storybook support is currently in an early stage, and there may be bugs, issues, or unsupported features in this plugin. The intention is to make this plugin more production-ready when Aurelia 2 reaches stable release. Currently, it only works with Vite, with Webpack support planned shortly.

This package provides an integration between Aurelia 2 and Storybook 8 using Vite. It lets you write and render Aurelia 2 components as Storybook stories with full support for Storybook controls, actions, and interactive testing.

## Features

- **Vite-Powered Build**: Uses Vite (via the provided preset) to bundle your stories.
- **Aurelia Enhancement**: Renders Aurelia 2 components using Aurelia's `enhance()` API.
- **Storybook 8 Compatibility**: Fully compatible with Storybook 8's new rendering API.
- **Arg & Action Support**: Use story args and actions as you would with any Storybook story.

## Installation

Install the plugin as a dev dependency:

```bash
npm install --save-dev @aurelia/storybook
```

Also, make sure to have the required dependencies installed in your project:

```bash
npm install --save-dev @storybook/addons @storybook/core-events @storybook/builder-vite @storybook/core-common @storybook/preview-api @storybook/types
```

> **Tip:** Check your existing Aurelia 2 app for already installed versions. The peer dependencies are expected to be compatible with Aurelia 2 beta releases (see `package.json` for version details).

## Getting Started

### Storybook Configuration

To integrate Aurelia 2 with your Storybook instance, follow these steps:

1. **Preset Setup**:
    The package comes with a minimal Storybook preset (see [src/preset.ts](src/preset.ts)) that allows you to adjust Vite's configuration if needed. Storybook will use this preset to set up the build system for your Aurelia stories.

2. **Framework Setup**:
    For a full Aurelia 2 integration with Vite and a TypeScript configuration, ensure that your Storybook configuration files are set up as follows:

    -   **.storybook/main.ts**
        Create or update your `.storybook/main.ts` file with the following contents:

        ```typescript
        import type { StorybookConfig } from '@storybook/core-common';
        import { mergeConfig } from 'vite';

        const config: StorybookConfig & { viteFinal?: (config: any, options: any) => any } = {
          stories: ['../src/stories/**/*.stories.@(ts|tsx|js|jsx|mdx)'],
          addons: [
              // Addons like:
              // '@storybook/addon-links',
              // '@storybook/addon-essentials',
              // '@storybook/addon-interactions'
          ],
          framework: {
            name: '@aurelia/storybook',
            options: {},
          },
          core: {
            builder: '@storybook/builder-vite',
          },
          viteFinal: async (viteConfig) => {
            viteConfig.optimizeDeps = viteConfig.optimizeDeps || {};
            viteConfig.optimizeDeps.exclude = viteConfig.optimizeDeps.exclude || [];
            if (!viteConfig.optimizeDeps.exclude.includes('@aurelia/runtime-html')) {
              viteConfig.optimizeDeps.exclude.push('@aurelia/runtime-html');
            }
            return mergeConfig(viteConfig, {
              // ...any additional Vite configuration
            });
          },
        };

        export default config as any;
        ```

    -   **.storybook/preview.ts**
        Next, update or create your `.storybook/preview.ts` file with the following code to import the render functions from the Aurelia Storybook plugin:

        ```typescript
        // .storybook/preview.ts
        // Import the render function from the plugin package.
        export { render, renderToCanvas } from '@aurelia/storybook';
        ```

    > **Note:** Addons such as `@storybook/addon-links`, `@storybook/addon-essentials`, and `@storybook/addon-interactions` are supported by installing them and adding them to the `addons` array in your configuration.

3. **Add scripts to your package.json**:
    Add the following scripts to your `package.json` file to work with Storybook:

    ```json
    "scripts": {
      "storybook": "storybook dev -p 6006",
      "build-storybook": "storybook build"
    }
    ```
    These scripts will allow you to start Storybook in development mode and build it for production.

### Writing Stories

Aurelia 2 stories are written similarly to standard Storybook stories, with a few Aurelia-specific details. Below is an example story file (`hello-world.stories.ts`) that demonstrates various scenarios:

```typescript
import { HelloWorld } from '../hello-world';
import { action } from '@storybook/addon-actions';
import { userEvent, within } from '@storybook/testing-library';

const meta = {
  title: 'Example/HelloWorld',
  component: HelloWorld,
  render: (args) => ({
    template: <hello-world message.bind="message" on-increment.bind="onIncrement"></hello-world>,
  }),
  argTypes: {
    message: { control: 'text' },
    onIncrement: { action: 'increment' }
  }
};

export default meta;

export const DefaultHelloWorld = {
  args: {
    message: "Hello from Storybook!",
    onIncrement: action('increment')
  }
};

export const InteractiveHelloWorld = {
  args: {
    message: "Try clicking the button!",
    onIncrement: action('increment')
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    // Simulate three button clicks
    await userEvent.click(button);
    await userEvent.click(button);
    await userEvent.click(button);
  }
};

export const NoArgs = {
  render: () => ({
    template: <hello-world></hello-world>
  })
};

export const WithCustomTemplate = {
  render: (args) => ({
    template: <hello-world message.bind="message">Click me!</hello-world>
  }),
  args: {
    message: "This is a custom message"
  }
};
```

### How It Works

- **Render Function**:  
  The integration exports a render function (`renderToCanvas`) that Storybook calls to mount your Aurelia component on the preview canvas. It clears the canvas, enhances it with Aurelia, and notifies Storybook when rendering is complete.

- **Aurelia Enhancement**:  
  Once the canvas is cleared, the integration instantiates a new Aurelia instance, registers your component (and any additional Aurelia modules you may specify), and calls the Aurelia `enhance()` API to bind your component's view to the DOM.

- **Arg Integration and Interactions**:  
  Just like with other Storybook frameworks, you can make your stories interactive by defining args and using the testing library's `play` function to simulate user interactions.

## Development

If you wish to contribute or modify the integration:

1. **Build the package** using TypeScript:

   ```bash
   npm run build
   ```

2. **Watch for changes** during development:

   ```bash
   npm run watch
   ```

3. **Link the package** in your Aurelia project:

   ```bash
   npm link @aurelia/storybook
   ```

4. **Run Storybook** in your local Aurelia application to see the integration in action.

## Contributing

Contributions, bug reports, and feature requests are welcome. Please open an issue or submit a pull request on the project repository.

## License

[MIT](LICENSE)

## Acknowledgements

Special shout out to Dmitry (@ekzobrain on GitHub) for the work he did on Storybook support for earlier versions of Storybook, which helped lay some of the groundwork for this implementation [https://github.com/ekzobrain/storybook](https://github.com/ekzobrain/storybook).