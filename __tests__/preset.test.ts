import {
  previewAnnotations,
  rsbuildFinal,
  viteFinal,
  webpackFinal,
} from '../src/preset';
import { getRsbuildRules, getRules } from '../src/webpack';

const presetMocks = vi.hoisted(() => ({
  mergeRsbuildConfig: vi.fn((base: Record<string, unknown>, extra: Record<string, unknown>) => ({
    ...base,
    ...extra,
    tools: {
      ...((base.tools as Record<string, unknown> | undefined) ?? {}),
      ...((extra.tools as Record<string, unknown> | undefined) ?? {}),
    },
  })),
  aureliaPlugin: vi.fn(() => [
    { name: 'aurelia:dev-alias' },
    { name: 'au2' },
  ]),
}));

vi.mock('@rsbuild/core', () => ({
  mergeRsbuildConfig: presetMocks.mergeRsbuildConfig,
}));

vi.mock('@aurelia/vite-plugin', () => ({
  default: presetMocks.aureliaPlugin,
}));

describe('webpackFinal', () => {
  it('creates module.rules and adds the Aurelia rules', async () => {
    const config = await webpackFinal({});
    expect(config.module.rules).toEqual(getRules());
  });

  it('keeps existing rules and avoids duplicate loader rules', async () => {
    const [typescriptRule] = getRules();
    const existing = { test: /\.css$/, use: 'css-loader' };
    const config = await webpackFinal({
      module: { rules: [existing, typescriptRule] },
    });
    expect(config.module.rules).toEqual([existing, ...getRules()]);
  });
});

describe('viteFinal', () => {
  beforeEach(() => {
    vi.stubEnv('VITEST', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('installs the Aurelia plugin and safe dependency defaults', async () => {
    const config = await viteFinal(
      {
        define: { existing: 'true' },
        optimizeDeps: { exclude: ['existing-dependency'] },
        resolve: { dedupe: ['existing-package'] },
      },
      { configType: 'PRODUCTION' }
    );

    expect(presetMocks.aureliaPlugin).toHaveBeenCalledWith({ useDev: false });
    expect(config.define.existing).toBe('true');
    expect(config.optimizeDeps.exclude).toEqual([
      'existing-dependency',
      'aurelia',
      '@aurelia/expression-parser',
      '@aurelia/kernel',
      '@aurelia/metadata',
      '@aurelia/platform',
      '@aurelia/platform-browser',
      '@aurelia/runtime',
      '@aurelia/runtime-html',
      '@aurelia/template-compiler',
    ]);
    expect(config.resolve.dedupe).toEqual([
      'existing-package',
      'aurelia',
      '@aurelia/expression-parser',
      '@aurelia/kernel',
      '@aurelia/metadata',
      '@aurelia/platform',
      '@aurelia/platform-browser',
      '@aurelia/runtime',
      '@aurelia/runtime-html',
      '@aurelia/template-compiler',
    ]);
  });

  it('does not install a second Aurelia plugin', async () => {
    await viteFinal({
      plugins: [[{ name: 'aurelia:dev-alias' }, { name: 'au2' }]],
      optimizeDeps: { exclude: ['@aurelia/runtime-html'] },
      resolve: { dedupe: ['aurelia'] },
    });

    expect(presetMocks.aureliaPlugin).not.toHaveBeenCalled();
  });

  it('does not inject a duplicate plugin into Storybook Vitest projects', async () => {
    vi.stubEnv('VITEST', 'true');

    const config = await viteFinal({});

    expect(presetMocks.aureliaPlugin).not.toHaveBeenCalled();
    expect(config.optimizeDeps.exclude).toContain('@aurelia/runtime-html');
    expect(config.resolve.dedupe).toContain('aurelia');
  });
});

describe('rsbuildFinal', () => {
  it('merges an Rspack hook that adds Aurelia rules once', async () => {
    const result = await rsbuildFinal({ tools: {} });
    const rspack = (result.tools as { rspack: (config: Record<string, unknown>) => void }).rspack;
    const config = { module: { rules: [getRsbuildRules()[0]] } };
    rspack(config);
    expect(config.module.rules).toEqual(getRsbuildRules());
  });
});

describe('previewAnnotations', () => {
  it('always adds the renderer annotation', async () => {
    const annotations = await previewAnnotations(['/existing.js']);
    expect(annotations[0]).toBe('/existing.js');
    expect(annotations.at(-1)).toMatch(/preview\.js$/);
  });

  it('adds the docs annotation when docs are configured', async () => {
    const annotations = await previewAnnotations([], {
      presets: {
        apply: vi.fn(async () => ({ defaultName: 'docs' })),
      },
    });
    expect(annotations).toHaveLength(2);
    expect(annotations[1]).toMatch(/preview-docs\.js$/);
  });
});
