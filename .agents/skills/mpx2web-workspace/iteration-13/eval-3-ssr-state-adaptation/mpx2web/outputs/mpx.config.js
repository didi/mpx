const config = {
  pluginOptions: {
    mpx: {
      plugin: {
        srcMode: 'wx',
        // 宿主提供 SSR 双入口和 renderer；客户端等待路由就绪后接管首屏。
        webConfig: { useSSR: true }
      }
    }
  }
}

// 页面路由前缀在 app.mpx 配置，此处配置 Web 静态资源的部署前缀。
if (process.env.MPX_CLI_MODE === 'web') {
  config.publicPath = '/help-demo/'
  // 宿主只读 vue-demi 的默认入口为 Vue 3；使用包内 Vue 2.7 入口支持 Pinia。
  // SSR 宿主若外置依赖，需让 pinia/vue-demi 经过此 Webpack 解析链。
  config.configureWebpack = {
    resolve: {
      alias: { 'vue-demi$': require.resolve('vue-demi/lib/v2.7/index.mjs') }
    }
  }
}

module.exports = config
