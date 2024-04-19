const NullDependency = require('webpack/lib/dependencies/NullDependency')
const makeSerializable = require('webpack/lib/util/makeSerializable')
const checkIsRuntimeMode = require('../utils/check-is-runtime')

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
    // this.mergeResourceHashNameMap(mpx)
    // 属性的收集
    // this.mergeComponentAttrs(mpx)

    return callback()
  }

  // mergeComponentAttrs (mpx) {
  //   const componentTypes = ['internalComponents', 'normalComponents', 'runtimeComponents']
  //   componentTypes.forEach(type => {
  //     const attrsMap = mpx.runtimeInfo[this.packageName][type]
  //     for (const tag in this[type]) {
  //       if (!attrsMap[tag]) {
  //         attrsMap[tag] = {}
  //       }
  //       Object.assign(attrsMap[tag], this[type][tag])
  //     }
  //   })
  // }

  mergeResource(mpx) {
    for (let resourcePath in this.usingComponents) {
      const componentName = this.usingComponents[resourcePath]
      const hashName = 'm' + mpx.pathHash(resourcePath)
      const dependencyComponentConfig = mpx.runtimeInfoJson[this.packageName][this.resourcePath]
      dependencyComponentConfig[componentName] = {
        hashName,
        resourcePath,
        isDynamic: checkIsRuntimeMode(resourcePath)
      }
    }
  }

  // mergeResourceHashNameMap (mpx) {
  //   Object.assign(mpx.runtimeInfo[this.packageName].resourceHashNameMap, this.resourceHashNameMap)
  // }

  serialize (context) {
    const { write } = context
    write(this.packageName)
    write(this.resourcePath)
    write(this.name)
    super.serialize(context)
  }

  deserialize (context) {
    const { read } = context
    this.packageName = read()
    this.resourcePath = read()
    this.name = read()
    super.deserialize(context)
  }
}

RecordJsonRuntimeInfoDependency.Template = class RecordModuleJsonDependencyTemplate {
  apply () {}
}

makeSerializable(RecordJsonRuntimeInfoDependency, '@mpxjs/webpack-plugin/lib/dependencies/RecordJsonRuntimeInfoDependency')

module.exports = RecordJsonRuntimeInfoDependency
