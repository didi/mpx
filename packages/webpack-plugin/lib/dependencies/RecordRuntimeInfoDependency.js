const NullDependency = require('webpack/lib/dependencies/NullDependency')
const makeSerializable = require('webpack/lib/util/makeSerializable')

class RecordRuntimeInfoDependency extends NullDependency {
  constructor (packageName, resourcePath, { type, info, index } = {}) {
    super()
    this.packageName = packageName
    this.resourcePath = resourcePath
    this.blockType = type
    this.info = info
    this.index = index
  }

  get type () {
    return 'mpx record runtime component info'
  }

  mpxAction (module, compilation, callback) {
    const mpx = compilation.__mpx__

    const runtimeInfoPackage = mpx.runtimeInfo[this.packageName] = mpx.runtimeInfo[this.packageName] || {}
    const componentInfo = runtimeInfoPackage[this.resourcePath] = runtimeInfoPackage[this.resourcePath] || {
      template: {},
      json: {},
      style: [],
      moduleId: '_' + mpx.pathHash(this.resourcePath)
    }

    const infoConfig = componentInfo[this.blockType]
    if (this.blockType === 'style') { // 多 style block 的场景
      infoConfig[this.index] = this.info
    } else {
      Object.assign(infoConfig, this.info)
    }

    return callback()
  }

  serialize (context) {
    const { write } = context
    write(this.packageName)
    write(this.resourcePath)
    write(this.blockType)
    write(this.info)
    write(this.index)
    super.serialize(context)
  }

  deserialize (context) {
    const { read } = context
    this.packageName = read()
    this.resourcePath = read()
    this.blockType = read()
    this.info = read()
    this.index = read()
    super.deserialize(context)
  }
}

RecordRuntimeInfoDependency.Template = class RecordRuntimeInfoDependencyTemplate {
  apply () {}
}

makeSerializable(RecordRuntimeInfoDependency, '@mpxjs/webpack-plugin/lib/dependencies/RecordRuntimeInfoDependency')

module.exports = RecordRuntimeInfoDependency
