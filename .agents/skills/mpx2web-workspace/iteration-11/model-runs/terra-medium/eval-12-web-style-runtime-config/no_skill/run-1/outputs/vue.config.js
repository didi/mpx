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
          // 设计稿约定 100rpx = 1rem。
          transRpxFn: function (match, value) {
            return `${value * 0.01}rem`
          }
        }
      }
    }
  }
}
