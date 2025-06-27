const config = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-links"
  ],
  framework: {
    name: '@aurelia/storybook',
    options: {},
  },
  core: {
    builder: '@storybook/builder-webpack5',
  },
  docs: {},
};
export default config; 