import { fileURLToPath } from 'node:url';
import { getRules, getRsbuildRules } from './webpack';

type StorybookPresetOptions = {
  configType?: 'DEVELOPMENT' | 'PRODUCTION';
  presets?: {
    apply: (name: string, initial: unknown, options: unknown) => Promise<unknown>;
  };
};

const aureliaRuntimePackages = [
  'aurelia',
  '@aurelia/expression-parser',
  '@aurelia/kernel',
  '@aurelia/metadata',
  '@aurelia/platform',
  '@aurelia/platform-browser',
  '@aurelia/runtime',
  '@aurelia/runtime-html',
  '@aurelia/template-compiler',
];

function addUnique<T>(existing: T[] | undefined, entries: T[]): T[] {
  return [...new Set([...(existing ?? []), ...entries])];
}

function loaderNames(rule: Record<string, unknown>): string {
  const use = Array.isArray(rule.use) ? rule.use : [rule.use];
  return use
    .flat(Infinity)
    .map((entry) =>
      typeof entry === 'string'
        ? entry
        : String((entry as { loader?: unknown } | undefined)?.loader ?? '')
    )
    .join('|');
}

function ruleKey(rule: Record<string, unknown>): string {
  return `${String(rule.test)}::${loaderNames(rule)}::${String(rule.enforce ?? '')}`;
}

function appendUniqueRules(existing: any[], rules: any[]): void {
  const seen = new Set(existing.map((rule) => ruleKey(rule)));
  for (const rule of rules) {
    const key = ruleKey(rule);
    if (!seen.has(key)) {
      existing.push(rule);
      seen.add(key);
    }
  }
}

/** Imports an optional peer, naming the builder that needs it when it is missing. */
async function importPeer<T>(
  load: () => Promise<T>,
  packageName: string,
  builder: string
): Promise<T> {
  try {
    return await load();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `@aurelia/storybook needs ${packageName} when used with the ${builder} builder. ${message}`,
      { cause: error }
    );
  }
}

function pluginNames(plugins: unknown[] | undefined): string[] {
  return (plugins ?? []).flat(Infinity).flatMap((plugin) => {
    if (!plugin || typeof plugin !== 'object') {
      return [];
    }
    const name = (plugin as { name?: unknown }).name;
    return typeof name === 'string' ? [name] : [];
  });
}

export async function viteFinal(
  config: Record<string, any>,
  options: StorybookPresetOptions = {}
): Promise<Record<string, any>> {
  const names = pluginNames(config.plugins);
  const hasAureliaPlugin = names.some(
    (name) => name === 'au2' || name.startsWith('aurelia:')
  );
  // The Storybook Vitest plugin applies framework Vite hooks inside its own
  // plugin. The consuming Vitest project must already include Aurelia's plugin;
  // adding it again here transforms convention templates twice.
  const isVitest = process.env.VITEST === 'true';
  if (!hasAureliaPlugin && !isVitest) {
    const { default: aurelia } = await importPeer(
      () => import('@aurelia/vite-plugin'),
      '@aurelia/vite-plugin',
      'Vite'
    );
    config.plugins = [
      ...(config.plugins ?? []),
      aurelia({ useDev: options.configType !== 'PRODUCTION' }),
    ];
  }

  config.define = {
    ...config.define,
    'process.env.NODE_ENV':
      config.define?.['process.env.NODE_ENV'] ??
      JSON.stringify(process.env.NODE_ENV || 'development'),
  };
  config.optimizeDeps = {
    ...config.optimizeDeps,
    exclude: addUnique(config.optimizeDeps?.exclude, aureliaRuntimePackages),
  };
  config.resolve = {
    ...config.resolve,
    dedupe: addUnique(config.resolve?.dedupe, aureliaRuntimePackages),
  };
  return config;
}

export async function rsbuildFinal(config: Record<string, any>) {
  const { mergeRsbuildConfig } = await importPeer(
    () => import('@rsbuild/core'),
    '@rsbuild/core',
    'Rsbuild'
  );
  return mergeRsbuildConfig(config, {
    tools: {
      rspack: (rspackConfig: Record<string, any>) => {
        rspackConfig.module ??= {};
        rspackConfig.module.rules ??= [];
        appendUniqueRules(rspackConfig.module.rules, getRsbuildRules());
        return rspackConfig;
      },
    },
  });
}

export async function webpackFinal(config: Record<string, any>) {
  config.module ??= {};
  config.module.rules ??= [];
  appendUniqueRules(config.module.rules, getRules());
  return config;
}

export const previewAnnotations = async (
  input: string[] = [],
  options: StorybookPresetOptions = {}
): Promise<string[]> => {
  const docsConfig = options.presets
    ? await options.presets.apply('docs', {}, options)
    : {};
  const docsEnabled =
    docsConfig != null &&
    typeof docsConfig === 'object' &&
    Object.keys(docsConfig).length > 0;
  const annotationPath = (relativePath: string) => {
    const url = new URL(relativePath, import.meta.url);
    return url.protocol === 'file:' ? fileURLToPath(url) : url.pathname;
  };

  return [
    ...input,
    annotationPath('./preview.js'),
    ...(docsEnabled
      ? [annotationPath('./preview-docs.js')]
      : []),
  ];
};

export default { previewAnnotations, viteFinal, rsbuildFinal, webpackFinal };
