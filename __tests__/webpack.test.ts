import { getRules } from '../src/webpack';

describe('webpack', () => {
  describe('getRules', () => {
    it('should return the correct rules', () => {
      const rules = getRules();
      expect(rules).toEqual([
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
  });
}); 