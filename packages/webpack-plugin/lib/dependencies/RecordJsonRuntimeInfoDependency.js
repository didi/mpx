const NullDependency = require('webpack/lib/dependencies/NullDependency')
const makeSerializable = require('webpack/lib/util/makeSerializable')

class RecordJsonRuntimeInfoDependency extends NullDependency {
  constructor (packageName, resourcePath, usingComponents) {
    super()
    this.packageName = packageName
    this.resourcePath = resourcePath
    this.usingComponents = usingComponents
  }

  get type () {
    return 'mpx record json usingComponents for runtime components'
  }

  mpxAction (module, compilation, callback) {
    const mpx = compilation.__mpx__
    if (!mpx.runtimeInfoJson[this.packageName]) {
      mpx.runtimeInfoJson[this.packageName] = {}
    }
    mpx.runtimeInfoJson[this.packageName][this.resourcePath] = {}

    this.mergeResource(mpx)

    return callback()
  }

  mergeResource (mpx) {
    for (const resourcePath in this.usingComponents) {
      const componentName = this.usingComponents[resourcePath]
      const hashName = 'm' + mpx.pathHash(resourcePath)
      const dependencyComponentConfig = mpx.runtimeInfoJson[this.packageName][this.resourcePath]
      dependencyComponentConfig[componentName] = {
        hashName,
        resourcePath,
        isDynamic: mpx.checkIsRuntimeMode(resourcePath)
      }
    }
  }

  serialize (context) {
    const { write } = context
    write(this.packageName)
    write(this.resourcePath)
    write(this.usingComponents)
    super.serialize(context)
  }

  deserialize (context) {
    const { read } = context
    this.packageName = read()
    this.resourcePath = read()
    this.usingComponents = read()
    super.deserialize(context)
  }
}

RecordJsonRuntimeInfoDependency.Template = class RecordModuleJsonDependencyTemplate {
  apply () {}
}

makeSerializable(RecordJsonRuntimeInfoDependency, '@mpxjs/webpack-plugin/lib/dependencies/RecordJsonRuntimeInfoDependency')

module.exports = RecordJsonRuntimeInfoDependency
