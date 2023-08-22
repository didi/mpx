const NullDependency = require('webpack/lib/dependencies/NullDependency')
const makeSerializable = require('webpack/lib/util/makeSerializable')

class RecordComponentInfoDependency extends NullDependency {
  constructor (resourcePath, tag, isRuntimeComponent, moduleId, componentPath) {
    super()
    this.resourcePath = resourcePath
    this.tag = tag
    this.isRuntimeComponent = isRuntimeComponent
    this.moduleId = moduleId
    this.componentPath = componentPath
  }

  get type () {
    return 'mpx record component info'
  }

  mpxAction (module, compilation, callback) {
    const mpx = compilation.__mpx__
    if (!mpx.componentDependencyInfo[this.resourcePath]) {
      mpx.componentDependencyInfo[this.resourcePath] = {}
    }
    mpx.componentDependencyInfo[this.resourcePath][this.tag] = {
      isRuntimeComponent: this.isRuntimeComponent,
      moduleId: this.moduleId,
      resourcePath: this.componentPath
    }
    return callback()
  }

  serialize (context) {
    const { write } = context
    write(this.resourcePath)
    write(this.tag)
    write(this.isRuntimeComponent)
    write(this.moduleId)
    write(this.componentPath)
    super.serialize(context)
  }

  deserialize (context) {
    const { read } = context
    this.resourcePath = read()
    this.tag = read()
    this.isRuntimeComponent = read()
    this.moduleId = read()
    this.componentPath = read()
    super.deserialize(context)
  }
}

RecordComponentInfoDependency.Template = class RecordModuleTemplateDependencyTemplate {
  apply () {}
}

makeSerializable(RecordComponentInfoDependency, '@mpxjs/webpack-plugin/lib/dependencies/RecordComponentInfoDependency')

module.exports = RecordComponentInfoDependency
