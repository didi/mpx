const path = require('path')
const NullDependency = require('webpack/lib/dependencies/NullDependency')
const makeSerializable = require('webpack/lib/util/makeSerializable')

class RequireExternalDependency extends NullDependency {
  constructor (range, url) {
    super()
    this.range = range
    this.url = url
  }

  get type () {
    return 'mpx require external'
  }

  updateHash (hash, context) {
    hash.update('' + (+new Date()) + Math.random())
    super.updateHash(hash, context)
  }

  serialize (context) {
    const { write } = context
    write(this.url)
    write(this.range)
    super.serialize(context)
  }

  deserialize (context) {
    const { read } = context
    this.url = read()
    this.range = read()
    super.deserialize(context)
  }
}

RequireExternalDependency.Template = class RequireExternalDependencyTemplate {
  apply (dependency, source, { module, chunkGraph, runtimeTemplate }) {
    const { range } = dependency
    const compliation = runtimeTemplate.compilation
    const publicPath = compliation.outputOptions.publicPath
    const chunks = chunkGraph.getModuleChunks(module)
    const chunk = chunks[0]
    const chunkPath = path.dirname(publicPath + chunk.name)
    const imgPath = publicPath + dependency.url
    let relativePath = path.relative(chunkPath, imgPath)
    if (!relativePath.startsWith('.')) {
      relativePath = './' + relativePath
    }

    compliation.__mpx__.externalRequests.add(relativePath)
    source.replace(range[0], range[1] - 1, `require(${JSON.stringify(relativePath)})`)
  }
}

makeSerializable(RequireExternalDependency, '@mpxjs/webpack-plugin/lib/dependencies/RequireExternalDependency')

module.exports = RequireExternalDependency
