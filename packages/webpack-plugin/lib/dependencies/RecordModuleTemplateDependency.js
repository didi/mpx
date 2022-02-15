const NullDependency = require('webpack/lib/dependencies/NullDependency')
const makeSerializable = require('webpack/lib/util/makeSerializable')

class RecordModuleTemplateDependency extends NullDependency {
  constructor (moduleId, requestString) {
    super()
    this.moduleId = moduleId
    this.requestString = requestString
  }

  get type () {
    return 'mpx record module template'
  }

  mpxAction (module, compilation, callback) {
    const mpx = compilation.__mpx__
    mpx.moduleTemplate[this.moduleId] = this.requestString
    return callback()
  }

  serialize (context) {
    const { write } = context
    write(this.moduleId)
    write(this.requestString)
    super.serialize(context)
  }

  deserialize (context) {
    const { read } = context
    this.moduleId = read()
    this.requestString = read()
    super.deserialize(context)
  }
}

RecordModuleTemplateDependency.Template = class RecordModuleTemplateDependencyTemplate {
  apply () {}
}

makeSerializable(RecordModuleTemplateDependency, '@mpxjs/webpack-plugin/lib/dependencies/RecordModuleTemplateDependency')

module.exports = RecordModuleTemplateDependency
