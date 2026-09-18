module.exports = {
  publicPath: '/help-demo/',
  pluginOptions: {
    mpx: {
      plugin: {
        srcMode: 'wx',
        webConfig: {
          useSSR: true,
          transRpxFn: function (match, value) {
            if (value === '0') return value
            return `${Number(value) / 2}px`
          }
        }
      }
    }
  }
}
