module.exports = {
  publicPath: '/help-demo/',
  pluginOptions: {
    mpx: {
      plugin: {
        srcMode: 'wx',
        webConfig: {
          useSSR: true
        }
      }
    }
  }
}
