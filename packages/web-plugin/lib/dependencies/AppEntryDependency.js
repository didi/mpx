const NullDependency = require('webpack/lib/dependencies/NullDependency')
const makeSerializable = require('webpack/lib/util/makeSerializable')

class AppEntryDependency extends NullDependency {
  constructor (resourcePath, name) {
    super()
    this.resourcePath = resourcePath
    this.name = name
  }

  get type () {
    return 'mpx app entry'
  }

  mpxAction (module, compilation, callback) {
    const mpx = compilation.__mpx__
    const moduleGraph = compilation.moduleGraph

    mpx.getEntryNode(module, 'app')

    if (mpx.appInfo.name) {
      const issuer = moduleGraph.getIssuer(module)
      const err = new Error(issuer
        ? `[json compiler]:Mpx单次构建中只能存在一个App，当前组件/页面[${module.resource}]通过[${issuer.resource}]非法引入，引用的资源将被忽略，请确保组件/页面资源通过usingComponents/pages配置引入！`
        : `[json compiler]:Mpx单次构建中只能存在一个App，请检查当前entry中的资源[${module.resource}]是否为组件/页面，通过添加?component/page查询字符串显式声明该资源是组件/页面！`)
      return callback(err)
    }

    mpx.appInfo = {
      resourcePath: this.resourcePath,
      name: this.name
    }
    return callback()
  }

  serialize (context) {
    const { write } = context
    write(this.resourcePath)
    write(this.name)
    super.serialize(context)
  }

  deserialize (context) {
    const { read } = context
    this.resourcePath = read()
    this.name = read()
    super.deserialize(context)
  }
}

AppEntryDependency.Template = class AppEntryDependencyTemplate {
  apply () {
  }
}

makeSerializable(AppEntryDependency, '@mpxjs/webpack-plugin/lib/dependencies/AppEntryDependency')

module.exports = AppEntryDependency
