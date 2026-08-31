module.exports = {
  publicPath: '/',
  pluginOptions: {
    mpx: {
      plugin: {
        webConfig: {
          useSSR: false,
          routeConfig: {
            mode: 'hash',
            base: '/'
          }
        }
      }
    }
  }
}
