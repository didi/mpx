const NullDependency = require('webpack/lib/dependencies/NullDependency')
const makeSerializable = require('webpack/lib/util/makeSerializable')

class RuntimeRenderPackageDependency extends NullDependency {
  constructor (packageName) {
    super()
    this.packageName = packageName
  }

  get type () {
    return 'mpx record runtime render package'
  }

  mpxAction (module, compilation, callback) {
    const mpx = compilation.__mpx__
    mpx.usingRuntimePackages.add(this.packageName)
    return callback()
  }

  serialize (context) {
    const { write } = context
    write(this.packageName)
    super.serialize(context)
  }

  deserialize (context) {
    const { read } = context
    this.packageName = read()
    super.deserialize(context)
  }
}

RuntimeRenderPackageDependency.Template = class RecordModuleTemplateDependencyTemplate {
  apply () {}
}

makeSerializable(RuntimeRenderPackageDependency, '@mpxjs/webpack-plugin/lib/dependencies/RuntimeRenderPackageDependency')

module.exports = RuntimeRenderPackageDependency
