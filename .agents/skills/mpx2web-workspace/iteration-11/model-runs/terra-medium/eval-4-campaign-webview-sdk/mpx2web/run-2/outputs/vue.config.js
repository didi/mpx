module.exports = {
  publicPath: '/mall/',
  pluginOptions: {
    mpx: {
      plugin: {
        webConfig: {
          routeConfig: {
            mode: 'history',
            base: '/mall/'
          }
        }
      }
    }
  }
}
