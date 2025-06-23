import { webpackFinal, viteFinal } from '../src/preset';
import { getRules } from '../src/webpack';

jest.mock('../src/webpack', () => ({
  getRules: jest.fn(() => [
    { test: /\.ts$/, use: 'ts-loader' },
    { test: /\.html$/, use: 'html-loader' },
  ]),
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
}); 