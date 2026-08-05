import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineMain } from '../src/node';

describe('framework configuration API', () => {
  it('returns a typed main configuration unchanged', () => {
    const config = {
      framework: {
        name: '@aurelia/storybook' as const,
        options: {},
      },
      stories: ['../src/**/*.stories.ts'],
      core: { builder: '@storybook/builder-vite' as const },
    };

    expect(defineMain(config)).toBe(config);
  });

  it('publishes node and development entry points', () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')
    );

    expect(packageJson.exports['./node']).toEqual({
      types: './dist/node.d.ts',
      default: './dist/node.js',
    });
    expect(packageJson.exports['./development']).toEqual(
      packageJson.exports['.']
    );
  });
});
