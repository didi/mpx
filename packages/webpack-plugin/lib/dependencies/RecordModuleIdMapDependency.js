const NullDependency = require('webpack/lib/dependencies/NullDependency')
const makeSerializable = require('webpack/lib/util/makeSerializable')

class RecordModuleIdMapDependency extends NullDependency {
  constructor (moduleId, filePath) {
    super()
    this.moduleId = moduleId
    this.filePath = filePath
  }

  get type () {
    return 'mpx record module id map'
  }

  mpxAction (module, compilation, callback) {
    const mpx = compilation.__mpx__
    const { moduleId, filePath } = this
    // 确保 resourceModuleIdMap 存在
    if (!mpx.resourceModuleIdMap) {
      mpx.resourceModuleIdMap = {}
    }
    // 记录 moduleId 和 filePath 的映射关系
    mpx.resourceModuleIdMap[moduleId] = filePath
    return callback()
  }

  serialize (context) {
    const { write } = context
    write(this.moduleId)
    write(this.filePath)
    super.serialize(context)
  }

  deserialize (context) {
    const { read } = context
    this.moduleId = read()
    this.filePath = read()
    super.deserialize(context)
  }
}

RecordModuleIdMapDependency.Template = class RecordModuleIdMapDependencyTemplate {
  apply () {
  }
}

makeSerializable(RecordModuleIdMapDependency, '@mpxjs/webpack-plugin/lib/dependencies/RecordModuleIdMapDependency')

module.exports = RecordModuleIdMapDependency
