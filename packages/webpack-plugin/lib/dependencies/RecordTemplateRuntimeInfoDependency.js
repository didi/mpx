const NullDependency = require('webpack/lib/dependencies/NullDependency')
const makeSerializable = require('webpack/lib/util/makeSerializable')

class RecordTemplateRuntimeInfoDependency extends NullDependency {
  constructor (packageName, resourcePath, { resourceHashNameMap, runtimeComponents, normalComponents, internalComponents } = {}) {
    super()
    this.packageName = packageName
    this.resourcePath = resourcePath
    this.resourceHashNameMap = resourceHashNameMap
    this.runtimeComponents = runtimeComponents
    this.normalComponents = normalComponents
    this.internalComponents = internalComponents
  }

  get type () {
    return 'mpx record template runtime info'
  }

  mpxAction (module, compilation, callback) {
    const mpx = compilation.__mpx__
    if (!mpx.runtimeInfo[this.packageName]) {
      mpx.runtimeInfo[this.packageName] = {
        resourceHashNameMap: {},
        internalComponents: {},
        normalComponents: {},
        runtimeComponents: {}
      }
    }

    this.mergeResourceHashNameMap(mpx)
    this.mergeComponentAttrs(mpx)

    return callback()
  }

  mergeComponentAttrs (mpx) {
    const componentTypes = ['internalComponents', 'normalComponents', 'runtimeComponents']
    componentTypes.forEach(type => {
      const attrsMap = mpx.runtimeInfo[this.packageName][type]
      for (let tag in this[type]) {
        if (!attrsMap[tag]) {
          attrsMap[tag] = {}
        }
        Object.assign(attrsMap[tag], this[type][tag])
      }
    })
  }

  mergeResourceHashNameMap (mpx) {
    Object.assign(mpx.runtimeInfo[this.packageName].resourceHashNameMap, this.resourceHashNameMap)
  }

  serialize (context) {
    const { write } = context
    write(this.packageName)
    write(this.resourcePath)
    write(this.resourceHashNameMap)
    write(this.runtimeComponents)
    write(this.normalComponents)
    write(this.internalComponents)
    super.serialize(context)
  }

  deserialize (context) {
    const { read } = context
    this.packageName = read()
    this.resourcePath = read()
    this.resourceHashNameMap = read()
    this.runtimeComponents = read()
    this.normalComponents = read()
    this.internalComponents = read()
    super.deserialize(context)
  }
}

RecordTemplateRuntimeInfoDependency.Template = class RecordModuleTemplateDependencyTemplate {
  apply () {}
}

makeSerializable(RecordTemplateRuntimeInfoDependency, '@mpxjs/webpack-plugin/lib/dependencies/RecordTemplateRuntimeInfoDependency')

module.exports = RecordTemplateRuntimeInfoDependency
