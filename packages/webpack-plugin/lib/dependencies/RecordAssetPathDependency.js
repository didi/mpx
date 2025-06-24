const NullDependency = require('webpack/lib/dependencies/NullDependency')
const makeSerializable = require('webpack/lib/util/makeSerializable')

class RecordAssetPathDependency extends NullDependency {
  constructor (assetPath) {
    super()
    this.assetPath = assetPath
  }

  get type () {
    return 'mpx record asset path'
  }

  mpxAction (module, compilation, callback) {
    const mpx = compilation.__mpx__
    mpx.assetPaths.add(this.assetPath)
    return callback()
  }

  serialize (context) {
    const { write } = context
    write(this.assetPath)
    super.serialize(context)
  }

  deserialize (context) {
    const { read } = context
    this.assetPath = read()
    super.deserialize(context)
  }
}

RecordAssetPathDependency.Template = class RecordAssetPathDependencyTemplate {
  apply () {
  }
}

makeSerializable(RecordAssetPathDependency, '@mpxjs/webpack-plugin/lib/dependencies/RecordAssetPathDependency')

module.exports = RecordAssetPathDependency

