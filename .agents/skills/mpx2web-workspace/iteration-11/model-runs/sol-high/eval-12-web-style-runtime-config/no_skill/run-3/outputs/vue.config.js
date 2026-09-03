const PORTAL_BASE = '/portal/'

module.exports = {
  publicPath: PORTAL_BASE,
  pluginOptions: {
    mpx: {
      plugin: {
        webConfig: {
          routeConfig: {
            mode: 'history',
            base: PORTAL_BASE
          },
          transRpxFn: function (match, value) {
            return `${Number(value) / 100}rem`
          }
        }
      }
    }
  }
}
