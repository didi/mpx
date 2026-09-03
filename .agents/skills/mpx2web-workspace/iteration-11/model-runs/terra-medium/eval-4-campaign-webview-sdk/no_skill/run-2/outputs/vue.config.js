module.exports = {
  // The deployed Web application is hosted below /mall/.
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
