// src/preset.ts
// Minimal preset for Storybook-Aurelia2

import { getRules } from './webpack';

/**
 * Optionally adjust the Vite configuration.
 */
export async function viteFinal(config: any): Promise<any> {
    // For now, return the config unchanged.
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

export const previewAnnotations = [require.resolve('./preview')];
