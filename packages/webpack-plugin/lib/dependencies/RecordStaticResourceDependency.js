const NullDependency = require('webpack/lib/dependencies/NullDependency')
const makeSerializable = require('webpack/lib/util/makeSerializable')


class RecordStaticResourceDependency extends NullDependency {
  constructor (resourcePath, outputPath, packageRoot = '') {
    super()
    this.resourcePath = resourcePath
    this.outputPath = outputPath
    this.packageRoot = packageRoot
  }

  get type () {
    return 'mpx record static resource'
  }

  mpxAction (module, compilation, callback) {
    const mpx = compilation.__mpx__
    const packageName = this.packageRoot || 'main'
    mpx.staticResourcesMap[packageName][this.resourcePath] = this.outputPath
    return callback()
  }

  serialize (context) {
    const { write } = context
    write(this.resourcePath)
    write(this.outputPath)
    write(this.packageRoot)
    super.serialize(context)
  }

  deserialize (context) {
    const { read } = context
    this.resourcePath = read()
    this.outputPath = read()
    this.packageRoot = read()
    super.deserialize(context)
  }
}

RecordStaticResourceDependency.Template = class RecordStaticResourceDependencyTemplate {
  apply () {
  }
}

makeSerializable(RecordStaticResourceDependency, '@mpxjs/webpack-plugin/lib/dependencies/RecordStaticResourceDependency')

module.exports = RecordStaticResourceDependency
