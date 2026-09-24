module.exports = {
  publicPath: '/help-demo/',
  pluginOptions: {
    mpx: {
      plugin: {
        srcMode: 'wx',
        externalClasses: ['custom-class', 'i-class', 'tone-class'],
        autoVirtualHostRules: {
          include: /src\/components\/layout-cell\.mpx$/
        },
        webConfig: {
          transRpxFn: function (match, value) {
            const size = Number(value)
            return size === 0 ? '0' : `${size / 2}px`
          }
        }
      }
    }
  }
}
