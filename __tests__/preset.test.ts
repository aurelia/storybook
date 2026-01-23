import { rsbuildFinal, webpackFinal, viteFinal } from '../src/preset';
import { getRsbuildRules, getRules } from '../src/webpack';

jest.mock('../src/webpack', () => ({
  getRules: jest.fn(() => [
    { test: /\.ts$/, use: 'ts-loader' },
    { test: /\.html$/, use: 'html-loader' },
  ]),
  getRsbuildRules: jest.fn(() => [
    { test: /\.ts$/, use: '@aurelia/webpack-loader' },
    { test: /\.html$/, use: '@aurelia/webpack-loader' },
  ]),
}));

const mergeRsbuildConfig = jest.fn((base, extra) => ({
  ...base,
  ...extra,
  tools: {
    ...base?.tools,
    ...extra?.tools,
  },
}));

jest.mock('@rsbuild/core', () => ({
  mergeRsbuildConfig,
}));

describe('preset', () => {
  describe('webpackFinal', () => {
    it('should add rules to the webpack config', async () => {
      const config = {
        module: {
          rules: [],
        },
      };
      const result = await webpackFinal(config);
      expect(result.module.rules).toEqual(getRules());
      expect(getRules).toHaveBeenCalled();
    });

    it('should handle a config with no module.rules', async () => {
      const config = {};
      const result = await webpackFinal(config);
      expect(result).toEqual(config);
    });

    it('should handle a config with existing rules', async () => {
      const existingRule = { test: /\.js$/, use: 'babel-loader' };
      const config = {
        module: {
          rules: [existingRule],
        },
      };
      const result = await webpackFinal(config);
      expect(result.module.rules).toEqual([existingRule, ...getRules()]);
    });
  });

  describe('viteFinal', () => {
    it('should return the config unchanged', async () => {
      const config = { some: 'property' };
      const result = await viteFinal(config);
      expect(result).toBe(config);
    });
  });

  describe('rsbuildFinal', () => {
    it('should merge rsbuild config and add Aurelia rules', async () => {
      const config = { tools: {} };
      const result = await rsbuildFinal(config);
      expect(mergeRsbuildConfig).toHaveBeenCalledWith(config, expect.any(Object));

      const rspackConfig = { module: { rules: [] as any[] } };
      result.tools.rspack(rspackConfig);
      expect(rspackConfig.module.rules).toEqual(getRsbuildRules());
    });
  });
});
