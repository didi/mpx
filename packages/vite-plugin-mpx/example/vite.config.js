import mpx from '../dist/index'

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
