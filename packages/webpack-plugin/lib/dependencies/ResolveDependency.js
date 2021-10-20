const NullDependency = require('webpack/lib/dependencies/NullDependency')
const parseRequest = require('../utils/parse-request')
const makeSerializable = require('webpack/lib/util/makeSerializable')

class ResolveDependency extends NullDependency {
  constructor (resource, packageName, issuerResource, range) {
    super()
    this.resource = resource
    this.packageName = packageName
    this.issuerResource = issuerResource
    this.range = range
    this.compilation = null
  }

  get type () {
    return 'mpx resolve'
  }

  mpxAction (module, compilation, callback) {
    this.compilation = compilation
    return callback()
  }

  getResolved () {
    const { resource, packageName, issuerResource, range, compilation } = this
    if (!compilation) return ''
    const publicPath = compilation.outputOptions.publicPath || ''
    const mpx = compilation.__mpx__
    if (!mpx) return ''
    const { pagesMap, componentsMap, staticResourcesMap } = mpx
    const { resourcePath } = parseRequest(resource)
    const currentComponentsMap = componentsMap[packageName]
    const mainComponentsMap = componentsMap.main
    const currentStaticResourcesMap = staticResourcesMap[packageName]
    const mainStaticResourcesMap = staticResourcesMap.main
    return pagesMap[resourcePath] || currentComponentsMap[resourcePath] || mainComponentsMap[resourcePath] || currentStaticResourcesMap[resourcePath] || mainStaticResourcesMap[resourcePath] || ''
  }

  // resolved可能会动态变更，需用此更新hash
  updateHash (hash, context) {
    const resolved = this.getResolved()
    if (resolved) hash.update(resolved)
    super.updateHash(hash, context)
  }

  serialize (context) {
    const { write } = context
    write(this.resource)
    write(this.packageName)
    write(this.issuerResource)
    write(this.range)
    super.serialize(context)
  }

  deserialize (context) {
    const { read } = context
    this.resource = read()
    this.packageName = read()
    this.issuerResource = read()
    this.range = read()
    super.deserialize(context)
  }
}

ResolveDependency.Template = class ResolveDependencyTemplate {
  apply (dep, source) {
    const content = this.getContent(dep)
    source.replace(dep.range[0], dep.range[1] - 1, content)
  }

  getContent (dep) {
    const { resource, issuerResource, compilation } = dep
    const publicPath = compilation.outputOptions.publicPath || ''
    const resolved = dep.getResolved()
    if (!resolved) {
      compilation.errors.push(new Error(`Path ${resource} is not a page/component/static resource, which is resolved from ${issuerResource}!`))
    }
    return JSON.stringify(publicPath + resolved)
  }
}

makeSerializable(ResolveDependency, '@mpxjs/webpack-plugin/lib/dependencies/ResolveDependency')

module.exports = ResolveDependency
