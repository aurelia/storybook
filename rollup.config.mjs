import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { glob } from 'glob';

const external = [
  '@aurelia/runtime-html',
  '@aurelia/vite-plugin',
  '@storybook/builder-vite',
  'aurelia',
  'react',
  'react-dom',
  'storybook/internal/core-events',
  'storybook/internal/types',
  'storybook/theming'
];

// Get all TypeScript files from src directory
const srcFiles = glob.sync('src/**/*.ts').reduce((acc, file) => {
  const key = file.replace(/^src\//, '').replace(/\.ts$/, '');
  acc[key] = file;
  return acc;
}, {});

const createConfig = (input, output) => ({
  input,
  output: {
    file: output,
    format: 'esm',
    sourcemap: true,
    exports: 'named'
  },
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      declaration: false,
      outDir: 'dist'
    }),
    resolve(),
    commonjs()
  ],
  external
});

// Create configs for all source files - ESM only for Storybook v10
const configs = Object.entries(srcFiles).map(([name, input]) =>
  createConfig(input, `dist/${name}.js`)
);

export default configs;