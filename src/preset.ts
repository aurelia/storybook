// src/preset.ts
// Minimal preset for Storybook-Aurelia2

/**
 * Optionally adjust the Vite configuration.
 */
export async function viteFinal(config: any): Promise<any> {
    // For now, return the config unchanged.
    return config;
  }
  
  // Export a default for compatibility.
  export default { viteFinal };
  