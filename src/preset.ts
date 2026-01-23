// src/preset.ts
// Minimal preset for Storybook-Aurelia2

import { getRules, getRsbuildRules } from './webpack';

/**
 * Optionally adjust the Vite configuration.
 */
export async function viteFinal(config: any): Promise<any> {
    // Configure Vite to properly handle dependencies
    config.define = config.define || {};
    config.define['process.env.NODE_ENV'] = JSON.stringify(process.env.NODE_ENV || 'development');
    
    // Configure optimization deps
    config.optimizeDeps = config.optimizeDeps || {};
    config.optimizeDeps.exclude = config.optimizeDeps.exclude || [];
    
    // Only exclude Aurelia-specific dependencies that cause issues
    const excludeList = [
        '@aurelia/runtime-html'
    ];
    
    excludeList.forEach(dep => {
        if (!config.optimizeDeps.exclude.includes(dep)) {
            config.optimizeDeps.exclude.push(dep);
        }
    });
    
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
                rules.push(...getRsbuildRules());
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
    const rules = config.module?.rules;
    if (rules) {
        rules.push(...getRules());
    }

    return config;
}

// Export a default for compatibility.
export default { viteFinal, rsbuildFinal, webpackFinal };

export const previewAnnotations = ['./preview.js'];
