import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  splitting: false,
  clean: true,
  treeshake: true,
  minify: true,
  outDir: 'dist',
  outExtension: ({ format }) => ({
    js: `.${format}.js`
  })
})
