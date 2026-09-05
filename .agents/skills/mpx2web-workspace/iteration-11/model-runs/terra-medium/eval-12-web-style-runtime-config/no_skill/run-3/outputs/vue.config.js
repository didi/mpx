module.exports = {
  publicPath: '/portal/',
  pluginOptions: {
    mpx: {
      plugin: {
        webConfig: {
          routeConfig: {
            mode: 'history',
            base: '/portal/'
          },
          // Design convention: 100rpx equals 1rem on Web.
          transRpxFn: function (match, value) {
            return `${Number(value) / 100}rem`
          }
        }
      }
    }
  }
}
