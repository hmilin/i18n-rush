import path from 'path';
import { defineConfig } from 'vite';
import nodeExternals from 'rollup-plugin-node-externals';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    mainFields: ['module', 'jsnext:main', 'jsnext'],
    conditions: ['node'],
  },
  plugins: [
    {
      enforce: 'pre',
      apply: 'build',
      ...nodeExternals({ deps: false }),
    },
  ],
  build: {
    minify: false,
    lib: {
      entry: path.resolve(__dirname, './src/cli.ts'),
      name: 'i18n-rush',
      formats: ['cjs'],
    },
    commonjsOptions: {
      ignoreDynamicRequires: true
    },
    rollupOptions: {
      external: ['@huggingface/transformers'],
    },
  },
});
