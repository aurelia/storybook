import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { glob } from 'glob';

const input = Object.fromEntries(
  glob
    .sync('src/**/*.ts')
    .filter(
      (file) =>
        file !== 'src/preview/types.ts' &&
        file !== 'src/preview/storybook-types.ts'
    )
    .map((file) => [
      file.replace(/^src\//, '').replace(/\.ts$/, ''),
      file,
    ])
);

export default {
  input,
  output: {
    dir: 'dist',
    format: 'esm',
    sourcemap: true,
    exports: 'named',
    preserveModules: true,
    preserveModulesRoot: 'src',
  },
  plugins: [
    typescript({
      tsconfig: './tsconfig.build.json',
      declaration: false,
      declarationMap: false,
    }),
    resolve(),
    commonjs(),
  ],
  external: (id) =>
    !id.startsWith('.') && !id.startsWith('/') && !id.startsWith('src/'),
};
