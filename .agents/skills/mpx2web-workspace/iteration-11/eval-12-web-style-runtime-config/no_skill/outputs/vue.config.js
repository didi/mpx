module.exports = {
  publicPath: '/portal/',
  pluginOptions: {
    mpx: {
      plugin: {
        webConfig: {
          routeConfig: { mode: 'history', base: '/portal/' },
          transRpxFn: function (match, value) {
            return `${value / 100}rem`
          }
        }
      }
    }
  }
}
