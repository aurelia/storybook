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

    it('should create module.rules when they are missing', async () => {
      const config = {};
      const result = await webpackFinal(config);
      expect(result.module.rules).toEqual(getRules());
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

    it('does not add duplicate Aurelia rules', async () => {
      const [tsRule] = getRules();
      const config = {
        module: {
          rules: [tsRule],
        },
      };

      const result = await webpackFinal(config);
      expect(result.module.rules).toEqual(getRules());
    });
  });

  describe('viteFinal', () => {
    it('should add Aurelia preview defaults', async () => {
      const config = {
        define: { existing: 'true' },
        optimizeDeps: { exclude: ['existing-dep'] },
      };
      const result = await viteFinal(config);
      expect(result).toBe(config);
      expect(result.define).toEqual({
        existing: 'true',
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      });
      expect(result.optimizeDeps.exclude).toEqual(['existing-dep', '@aurelia/runtime-html']);
    });

    it('does not duplicate optimizeDeps exclusions', async () => {
      const config = {
        optimizeDeps: { exclude: ['@aurelia/runtime-html'] },
      };
      const result = await viteFinal(config);
      expect(result.optimizeDeps.exclude).toEqual(['@aurelia/runtime-html']);
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

    it('does not add duplicate rsbuild rules', async () => {
      const config = { tools: {} };
      const result = await rsbuildFinal(config);
      const [tsRule] = getRsbuildRules();
      const rspackConfig = { module: { rules: [tsRule] as any[] } };
      result.tools.rspack(rspackConfig);
      expect(rspackConfig.module.rules).toEqual(getRsbuildRules());
    });
  });
});
