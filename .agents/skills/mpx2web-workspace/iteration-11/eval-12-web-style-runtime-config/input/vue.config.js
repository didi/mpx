module.exports = {
  publicPath: '/',
  pluginOptions: {
    mpx: {
      plugin: {
        webConfig: {
          routeConfig: { mode: 'history', base: '/' },
          transRpxFn: function (match, value) {
            return `${value * 0.01}rem`
          }
        }
      }
    }
  }
}
