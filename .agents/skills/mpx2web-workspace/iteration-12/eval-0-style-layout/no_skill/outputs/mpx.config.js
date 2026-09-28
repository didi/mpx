// Web keeps all declared pages as routes, but does not preserve WeChat's
// workers directory contract or independent-subpackage runtime isolation.
// Those two declarations in app.mpx remain effective for the WeChat build;
// on Web, subpackage pages are ordinary application routes and a browser
// Worker must be built and instantiated separately when one is needed.
module.exports = {
  publicPath: '/help-demo/',
  pluginOptions: {
    mpx: {
      plugin: {
        srcMode: 'wx',
        webConfig: {
          router: {
            mode: 'history',
            base: '/help-demo/'
          }
        }
      }
    }
  }
}
