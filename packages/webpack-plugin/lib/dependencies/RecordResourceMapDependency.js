const NullDependency = require('webpack/lib/dependencies/NullDependency')
const makeSerializable = require('webpack/lib/util/makeSerializable')

class RecordResourceMapDependency extends NullDependency {
  constructor (resourcePath, resourceType, outputPath, packageRoot = '') {
    super()
    this.resourcePath = resourcePath
    this.resourceType = resourceType
    this.outputPath = outputPath
    this.packageRoot = packageRoot
  }

  get type () {
    return 'mpx record resource map'
  }

  mpxAction (module, compilation, callback) {
    const mpx = compilation.__mpx__
    const { resourcePath, resourceType, outputPath, packageRoot } = this
    mpx.recordResourceMap({
      resourcePath,
      resourceType,
      outputPath,
      packageRoot,
      recordOnly: true,
      warn (e) {
        compilation.warnings.push(e)
      },
      error (e) {
        compilation.errors.push(e)
      }
    })
    return callback()
  }

  serialize (context) {
    const { write } = context
    write(this.resourcePath)
    write(this.resourceType)
    write(this.outputPath)
    write(this.packageRoot)
    super.serialize(context)
  }

  deserialize (context) {
    const { read } = context
    this.resourcePath = read()
    this.resourceType = read()
    this.outputPath = read()
    this.packageRoot = read()
    super.deserialize(context)
  }
}

RecordResourceMapDependency.Template = class RecordResourceMapDependencyTemplate {
  apply () {
  }
}

makeSerializable(RecordResourceMapDependency, '@mpxjs/webpack-plugin/lib/dependencies/RecordResourceMapDependency')

module.exports = RecordResourceMapDependency
