module.exports = {
  outputDir: 'dist',
  pluginOptions: {
    mpx: {
      plugin: {
        webConfig: {
          useSSR: false,
          routeConfig: {
            mode: 'hash'
          }
        }
      }
    }
  }
}
