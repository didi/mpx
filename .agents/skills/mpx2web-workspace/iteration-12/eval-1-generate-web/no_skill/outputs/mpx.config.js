module.exports = {
  outputDir: `dist/${process.env.MPX_CURRENT_TARGET_MODE}`,
  publicPath: '/profile-demo/',
  pluginOptions: {
    mpx: {
      plugin: {
        srcMode: 'wx',
        // Keep Mpx's defaults while adding the external class used below.
        externalClasses: ['custom-class', 'i-class', 'accent-class'],
        webConfig: {
          routeConfig: {
            mode: 'history',
            base: '/profile-demo/'
          }
        }
      },
      loader: {}
    }
  }
}
