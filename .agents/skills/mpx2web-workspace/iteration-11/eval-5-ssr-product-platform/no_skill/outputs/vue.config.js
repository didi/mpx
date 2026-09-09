module.exports = {
  publicPath: '/mall/',
  pluginOptions: {
    mpx: {
      plugin: {
        webConfig: {
          useSSR: true,
          routeConfig: { mode: 'history', base: '/mall/' }
        }
      }
    }
  }
}
