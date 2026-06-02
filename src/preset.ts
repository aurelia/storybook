// src/preset.ts
// Minimal preset for Storybook-Aurelia2

import { getRules, getRsbuildRules } from './webpack';

function addUnique<T>(existing: T[] | undefined, entries: T[]): T[] {
    return Array.from(new Set([...(existing ?? []), ...entries]));
}

function ruleKey(rule: any): string {
    const use = Array.isArray(rule.use) ? rule.use.join('|') : String(rule.use ?? '');
    return `${String(rule.test)}::${use}::${String(rule.enforce ?? '')}`;
}

function appendUniqueRules(existing: any[], rules: any[]): any[] {
    const seen = new Set(existing.map(ruleKey));
    for (const rule of rules) {
        const key = ruleKey(rule);
        if (!seen.has(key)) {
            existing.push(rule);
            seen.add(key);
        }
    }
    return existing;
}

/**
 * Optionally adjust the Vite configuration.
 */
export async function viteFinal(config: any): Promise<any> {
    config.define = {
        ...(config.define ?? {}),
        'process.env.NODE_ENV': config.define?.['process.env.NODE_ENV'] ?? JSON.stringify(process.env.NODE_ENV || 'development'),
    };

    config.optimizeDeps = {
        ...(config.optimizeDeps ?? {}),
        exclude: addUnique(config.optimizeDeps?.exclude, ['@aurelia/runtime-html']),
    };

    return config;
}

async function loadMergeRsbuildConfig() {
    try {
        const { mergeRsbuildConfig } = await import('@rsbuild/core');
        return mergeRsbuildConfig;
    } catch (error: any) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(
            `@aurelia/storybook: rsbuild support requires @rsbuild/core to be installed. Original error: ${message}`
        );
    }
}

/**
 * Optionally adjust the Rsbuild configuration (Rspack-based).
 */
export async function rsbuildFinal(config: any): Promise<any> {
    const mergeRsbuildConfig = await loadMergeRsbuildConfig();

    return mergeRsbuildConfig(config, {
        tools: {
            rspack: (rspackConfig: any) => {
                const moduleConfig = rspackConfig.module ?? (rspackConfig.module = {});
                const rules = moduleConfig.rules ?? (moduleConfig.rules = []);
                appendUniqueRules(rules, getRsbuildRules());
                return rspackConfig;
            }
        }
    });
}

/**
 * A function to configure webpack.
 * @param config
 * @returns
 */
export async function webpackFinal(config: any): Promise<any> {
    const moduleConfig = config.module ?? (config.module = {});
    const rules = moduleConfig.rules ?? (moduleConfig.rules = []);
    appendUniqueRules(rules, getRules());

    return config;
}

// Export a default for compatibility.
export default { viteFinal, rsbuildFinal, webpackFinal };

export const previewAnnotations = ['./preview.js'];
