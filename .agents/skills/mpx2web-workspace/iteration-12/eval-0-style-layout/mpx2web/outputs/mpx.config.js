module.exports = {
  publicPath: '/help-demo/',
  pluginOptions: {
    mpx: {
      plugin: {
        srcMode: 'wx',
        externalClasses: ['custom-class', 'i-class', 'tone-class'],
        autoVirtualHostRules: {
          include: /src[\\/]components[\\/]layout-cell\.mpx$/
        },
        webConfig: {
          transRpxFn: function (match, value) {
            if (value === '0') return '0'
            return `${Number(value) / 2}px`
          }
        }
      }
    }
  }
}
