const path = require('path')

module.exports = {
  pluginOptions: {
    mpx: {
      plugin: {
        webConfig: {
          // Only the Web compiler resolves this replacement.  The base .mpx
          // component therefore remains free of Vue/chart dependencies.
          customBuiltInComponents: {
            'mpx-scroll-view': path.resolve(__dirname, 'src/web/AnalyticsScroll.vue')
          }
        }
      }
    }
  }
}
