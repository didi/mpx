module.exports = {
  publicPath: '/',
  pluginOptions: {
    mpx: {
      plugin: {
        webConfig: {
          useSSR: true,
          routeConfig: { mode: 'history', base: '/' }
        }
      }
    }
  }
}
