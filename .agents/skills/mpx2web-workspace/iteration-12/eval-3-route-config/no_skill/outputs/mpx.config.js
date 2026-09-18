// Production must mount both the SSR renderer and its client assets at
// /help-demo/. Requests below that prefix which are not static assets should
// be forwarded to the renderer (the host passes the prefix-stripped URL).
// The existing createStore import also requires the matching optional peer:
// install @mpxjs/store@^2.11.0 alongside @mpxjs/core.
module.exports = {
  publicPath: '/help-demo/',
  pluginOptions: {
    mpx: {
      plugin: {
        srcMode: 'wx',
        webConfig: {
          useSSR: true,
          routeConfig: {
            mode: 'history',
            base: '/help-demo/'
          },
          // The Web design grid is fixed at 750 logical units: 2rpx = 1px.
          // Unlike the default vw conversion, this remains stable at both
          // 375px and 750px viewport widths. Mini-program rpx is unaffected.
          transRpxFn: value => `${Number(value) / 2}px`
        }
      }
    }
  }
}
