import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  outDir: 'dist',
  clean: true,
  minify: false,
  splitting: false, // unstable: https://esbuild.github.io/api/#line-limit
  sourcemap: true,
  treeshake: true,
  outExtension: ({ format }) => ({
    js: `.${format}.js`
  })
})

// TODO : use tsdown when it is more stable
