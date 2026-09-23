const webBase = '/profile-demo/'

module.exports = {
  // Web 静态资源与 history 路由使用同一个部署前缀。
  publicPath: webBase,
  pluginOptions: {
    mpx: {
      srcMode: 'wx',
      loader: {
        // custom-class 是框架的默认外部类；在它之后追加本项目使用的外部类。
        externalClasses: ['custom-class', 'accent-class']
      },
      webConfig: {
        router: {
          mode: 'history',
          base: webBase
        }
      }
    }
  }
}
