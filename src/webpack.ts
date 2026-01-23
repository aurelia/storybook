// src/webpack.ts
import type { RuleSetRule } from 'webpack';

/**
 * A set of rules to be added to the webpack configuration.
 * @returns
 */
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

/**
 * Rsbuild/Rspack rules (avoid ts-loader; Rsbuild handles TS transpilation).
 */
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
