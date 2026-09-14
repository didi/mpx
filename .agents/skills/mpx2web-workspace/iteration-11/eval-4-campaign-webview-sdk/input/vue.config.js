module.exports = {
  publicPath: '/',
  pluginOptions: {
    mpx: {
      plugin: {
        webConfig: {
          routeConfig: {
            mode: 'history',
            base: '/'
          }
        }
      }
    }
  }
}
