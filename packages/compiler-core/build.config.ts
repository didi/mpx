import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index'
  ],
  declaration: true,
  clean: true,
  sourcemap: true,
  rollup: {
    emitCJS: true,
    esbuild: {
      drop: ['debugger'],
      define: {
        __DEV__: JSON.stringify(false),
        // TODO 未来浏览器版本
        __BROWSER__: JSON.stringify(false)
      }
    }
  }
})
