const NullDependency = require('webpack/lib/dependencies/NullDependency')
const makeSerializable = require('webpack/lib/util/makeSerializable')

class RecordTemplateRuntimeInfoDependency extends NullDependency {
  constructor (packageName, resourcePath, { baseComponents, customComponents } = {}) {
    super()
    this.packageName = packageName
    this.resourcePath = resourcePath
    this.baseComponents = baseComponents
    this.customComponents = customComponents
  }

  get type () {
    return 'mpx record template runtime info'
  }

  mpxAction (module, compilation, callback) {
    const mpx = compilation.__mpx__
    if (!mpx.runtimeInfoTemplate[this.packageName]) {
      mpx.runtimeInfoTemplate[this.packageName] = {}
    }
    mpx.runtimeInfoTemplate[this.packageName][this.resourcePath] = {
      baseComponents: {},
      customComponents: {}
    }

    this.mergeTemplateUsingComponents(mpx)

    return callback()
  }

  mergeTemplateUsingComponents (mpx) {
    const componentTypes = ['baseComponents', 'customComponents']
    componentTypes.forEach(type => {
      const attrsMap = mpx.runtimeInfoTemplate[this.packageName][this.resourcePath][type]
      for (const tag in this[type]) {
        if (!attrsMap[tag]) {
          attrsMap[tag] = {}
        }
        Object.assign(attrsMap[tag], this[type][tag])
      }
    })
  }

  serialize (context) {
    const { write } = context
    write(this.packageName)
    write(this.resourcePath)
    write(this.baseComponents)
    write(this.customComponents)
    super.serialize(context)
  }

  deserialize (context) {
    const { read } = context
    this.packageName = read()
    this.resourcePath = read()
    this.baseComponents = read()
    this.customComponents = read()
    super.deserialize(context)
  }
}

RecordTemplateRuntimeInfoDependency.Template = class RecordModuleTemplateDependencyTemplate {
  apply () {}
}

makeSerializable(RecordTemplateRuntimeInfoDependency, '@mpxjs/webpack-plugin/lib/dependencies/RecordTemplateRuntimeInfoDependency')

module.exports = RecordTemplateRuntimeInfoDependency
