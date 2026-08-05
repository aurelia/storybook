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

function appendUniqueRules(
  existing: any[],
  rules: any[]
): any[] {
  const seen = new Set(existing.map((rule) => ruleKey(rule)));
  for (const rule of rules) {
    const key = ruleKey(rule);
    if (!seen.has(key)) {
      existing.push(rule);
      seen.add(key);
    }
  }
  return existing;
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
    try {
      const { default: aurelia } = await import('@aurelia/vite-plugin');
      config.plugins = [
        ...(config.plugins ?? []),
        aurelia({ useDev: options.configType !== 'PRODUCTION' }),
      ];
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `@aurelia/storybook needs @aurelia/vite-plugin when used with the Vite builder. ${message}`,
        { cause: error }
      );
    }
  }

  config.define = {
    ...(config.define ?? {}),
    'process.env.NODE_ENV':
      config.define?.['process.env.NODE_ENV'] ??
      JSON.stringify(process.env.NODE_ENV || 'development'),
  };
  config.optimizeDeps = {
    ...(config.optimizeDeps ?? {}),
    exclude: addUnique(config.optimizeDeps?.exclude, aureliaRuntimePackages),
  };
  config.resolve = {
    ...(config.resolve ?? {}),
    dedupe: addUnique(config.resolve?.dedupe, aureliaRuntimePackages),
  };
  return config;
}

async function loadMergeRsbuildConfig() {
  try {
    const { mergeRsbuildConfig } = await import('@rsbuild/core');
    return mergeRsbuildConfig;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `@aurelia/storybook needs @rsbuild/core when used with the Rsbuild builder. ${message}`,
      { cause: error }
    );
  }
}

export async function rsbuildFinal(config: Record<string, any>) {
  const mergeRsbuildConfig = await loadMergeRsbuildConfig();
  return mergeRsbuildConfig(config, {
    tools: {
      rspack: (rspackConfig: Record<string, any>) => {
        const moduleConfig = rspackConfig.module ?? (rspackConfig.module = {});
        const rules = moduleConfig.rules ?? (moduleConfig.rules = []);
        appendUniqueRules(rules, getRsbuildRules());
        return rspackConfig;
      },
    },
  });
}

export async function webpackFinal(config: Record<string, any>) {
  const moduleConfig = config.module ?? (config.module = {});
  const rules = moduleConfig.rules ?? (moduleConfig.rules = []);
  appendUniqueRules(rules, getRules());
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
