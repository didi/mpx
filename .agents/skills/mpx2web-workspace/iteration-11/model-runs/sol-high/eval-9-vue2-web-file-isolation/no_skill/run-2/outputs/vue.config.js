const path = require('path')

const analyticsScroll = path.resolve(__dirname, 'src/web/AnalyticsScroll.vue')

module.exports = {
  pluginOptions: {
    mpx: {
      plugin: {
        webConfig: {
          customBuiltInComponents: {
            'mpx-scroll-view': analyticsScroll
          }
        }
      }
    }
  }
}
