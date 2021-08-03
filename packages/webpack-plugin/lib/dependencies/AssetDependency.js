const NullDependency = require('webpack/lib/dependencies/NullDependency')
const makeSerializable = require('webpack/lib/util/makeSerializable')

class AssetDependency extends NullDependency {
  constructor (name, source, info) {
    super()
    this.name = name
    this.source = source
    this.info = info
  }

  get type () {
    return 'mpx asset'
  }

  updateHash (hash) {
    super.updateHash(hash)
    hash.update(this.source)
  }

  depAction (compilation) {
    compilation.emitAsset(this.name, this.source, this.assetInfo)
  }

  serialize (context) {
    const { write } = context
    write(this.name)
    write(this.source)
    write(this.info)
    super.serialize(context)
  }

  deserialize (context) {
    const { read } = context
    this.name = read()
    this.source = read()
    this.info = read()
    super.deserialize(context)
  }
}

AssetDependency.Template = class AssetDependencyTemplate {
  apply () {
  }
}

makeSerializable(AssetDependency, '@mpxjs/webpack-plugin/lib/dependencies/AssetDependency')

module.exports = AssetDependency
