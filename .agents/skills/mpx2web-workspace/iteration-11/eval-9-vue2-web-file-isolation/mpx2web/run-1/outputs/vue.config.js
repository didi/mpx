const path = require('path')

module.exports = {
  pluginOptions: {
    mpx: {
      plugin: {
        webConfig: {
          customBuiltInComponents: {
            'scroll-view': path.resolve(__dirname, 'src/web/AnalyticsScroll.vue')
          }
        }
      }
    }
  }
}
