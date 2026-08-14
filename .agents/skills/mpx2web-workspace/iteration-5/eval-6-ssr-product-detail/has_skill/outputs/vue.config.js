module.exports = {
  outputDir: 'dist',
  pluginOptions: {
    mpx: {
      plugin: {
        webConfig: {
          useSSR: true,
          routeConfig: {
            mode: 'history'
          }
        }
      }
    }
  }
}
