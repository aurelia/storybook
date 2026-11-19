import type { RuleSetRule } from 'webpack';

/** Webpack 5 rules that compile Aurelia TypeScript and HTML templates. */
export function getRules(): RuleSetRule[] {
  return [
    {
      test: /\.ts$/i,
      use: ['ts-loader', '@aurelia/webpack-loader'],
      exclude: /node_modules/,
    },
    {
      test: /\.html$/i,
      use: '@aurelia/webpack-loader',
      exclude: /node_modules/,
    },
  ];
}

/** Rspack rules for Rsbuild, which transpiles TypeScript itself so `ts-loader` is not needed. */
export function getRsbuildRules(): RuleSetRule[] {
  return [
    {
      test: /\.ts$/i,
      enforce: 'pre',
      use: ['@aurelia/webpack-loader'],
      exclude: /node_modules/,
    },
    {
      test: /\.html$/i,
      use: '@aurelia/webpack-loader',
      exclude: /node_modules/,
    },
  ];
}
