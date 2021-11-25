import mpx from '../../packages/vite-plugin-mpx/dist/index.js'

export default {
  plugins: [
    mpx({
      root: true
    })
  ],
  build: {
    target: ['es2015'],
    sourcemap: true,
    minify: false
  }
}
