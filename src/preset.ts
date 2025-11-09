// src/preset.ts
// Minimal preset for Storybook-Aurelia2

import { getRules } from './webpack';

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
export default { viteFinal, webpackFinal };

export const previewAnnotations = ['./preview.js'];
