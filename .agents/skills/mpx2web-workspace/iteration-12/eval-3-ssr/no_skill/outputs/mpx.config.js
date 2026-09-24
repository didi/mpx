module.exports = {
  publicPath: '/help-demo/',
  pluginOptions: {
    mpx: {
      plugin: {
        srcMode: 'wx',
        webConfig: {
          useSSR: true,
          routeConfig: {
            mode: 'history',
            base: '/help-demo/'
          }
        }
      }
    }
  }
}
