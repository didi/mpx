module.exports = {
  publicPath: '/portal/',
  pluginOptions: {
    mpx: {
      plugin: {
        webConfig: {
          routeConfig: { mode: 'history', base: '/portal/' },
          transRpxFn: function (match, value) {
            // Design convention: 100rpx = 1rem.
            return `${value * 0.01}rem`
          }
        }
      }
    }
  }
}
