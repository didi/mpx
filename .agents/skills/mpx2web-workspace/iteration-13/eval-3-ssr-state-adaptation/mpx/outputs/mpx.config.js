module.exports = {
  // Web 静态资源与 history 路由共用部署前缀；wx 仍由 CLI 的目标构建链处理。
  publicPath: '/help-demo/',
  configureWebpack: {
    resolve: {
      alias: {
        // Web 运行于 Vue 2.7；显式选用包内对应入口，兼容当前只读依赖的 Vue 3 默认指向。
        // wx 的 @mpxjs/pinia 不依赖 vue-demi，不受此别名影响。
        'vue-demi$': require.resolve('vue-demi/lib/v2.7/index.mjs')
      }
    }
  },
  pluginOptions: {
    mpx: {
      plugin: {
        srcMode: 'wx',
        // 两端构建继续由宿主选择目标；useSSR 只让浏览器等待路由就绪后接管。
        // 宿主 server/client 入口均指向 src/app.mpx，并提供 bundle、manifest 和 renderer。
        webConfig: { useSSR: true }
      }
    }
  }
}
