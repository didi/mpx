const path = require('path')

module.exports = {
  publicPath: '/help-demo/',
  pluginOptions: {
    mpx: {
      plugin: {
        srcMode: 'wx',
        externalClasses: ['custom-class', 'i-class', 'tone-class'],
        autoVirtualHostRules: {
          include: path.resolve(__dirname, 'src/components/layout-cell.mpx')
        },
        webConfig: {
          routeConfig: {
            mode: 'history',
            base: '/help-demo/'
          },
          transRpxFn: (match, value) => {
            return value === '0' ? '0' : `${Number(value) / 2}px`
          }
        }
      }
    }
  }
}
