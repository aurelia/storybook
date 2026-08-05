import { getRsbuildRules, getRules } from '../src/webpack';

describe('builder rules', () => {
  it('uses TypeScript and the Aurelia loader under Webpack', () => {
    expect(getRules()).toEqual([
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
    ]);
  });

  it('lets Rsbuild transpile TypeScript after the Aurelia pre-loader', () => {
    expect(getRsbuildRules()).toEqual([
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
    ]);
  });
});
