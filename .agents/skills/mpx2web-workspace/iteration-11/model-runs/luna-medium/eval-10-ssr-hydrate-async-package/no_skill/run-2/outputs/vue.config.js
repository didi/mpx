module.exports = {
  publicPath: '/content/',
  pluginOptions: {
    mpx: {
      plugin: {
        webConfig: {
          useSSR: true,
          routeConfig: { mode: 'history', base: '/content/' }
        }
      }
    }
  }
}
