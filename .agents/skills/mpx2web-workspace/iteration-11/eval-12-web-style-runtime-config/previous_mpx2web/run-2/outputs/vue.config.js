module.exports = {
  publicPath: '/portal/',
  pluginOptions: {
    mpx: {
      plugin: {
        webConfig: {
          routeConfig: { mode: 'history', base: '/portal/' },
          transRpxFn: function (match, value) {
            if (Number(value) === 0) return '0'
            return `${value * 0.01}rem`
          }
        }
      }
    }
  }
}
