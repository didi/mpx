const NullDependency = require('webpack/lib/dependencies/NullDependency')
const parseRequest = require('../utils/parse-request')

class ResolveDependency extends NullDependency {
  constructor (resource, packageName, pagesMap, componentsMap, staticResourcesMap, publicPath, range, issuerResource, compilation) {
    super()
    this.resource = resource
    this.packageName = packageName
    this.pagesMap = pagesMap
    this.componentsMap = componentsMap
    this.staticResourcesMap = staticResourcesMap
    this.publicPath = publicPath
    this.range = range
    this.issuerResource = issuerResource
    this.compilation = compilation
  }

  get type () {
    return 'mpx resolve'
  }

  updateHash (hash) {
    super.updateHash(hash)
    hash.update(this.resource)
  }
}

ResolveDependency.Template = class ResolveDependencyTemplate {
  apply (dep, source) {
    const content = this.getContent(dep)
    source.replace(dep.range[0], dep.range[1] - 1, content)
  }

  getContent (dep) {
    const resourcePath = parseRequest(dep.resource).resourcePath
    const pagesMap = dep.pagesMap
    const componentsMap = dep.componentsMap[dep.packageName]
    const mainComponentsMap = dep.componentsMap.main
    const staticResourcesMap = dep.staticResourcesMap[dep.packageName]
    const mainStaticResourcesMap = dep.staticResourcesMap.main
    const resolved = pagesMap[resourcePath] || componentsMap[resourcePath] || mainComponentsMap[resourcePath] || staticResourcesMap[resourcePath] || mainStaticResourcesMap[resourcePath] || ''
    if (!resolved) {
      dep.compilation.errors.push(new Error(`Path ${dep.resource} is not a page/component/static resource, which is resolved from ${dep.issuerResource}!`))
    }
    return JSON.stringify(dep.publicPath + resolved)
  }
}

module.exports = ResolveDependency
