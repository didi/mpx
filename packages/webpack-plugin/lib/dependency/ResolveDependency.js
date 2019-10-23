'use strict'
const NullDependency = require('webpack/lib/dependencies/NullDependency')
const parseRequest = require('../utils/parse-request')

class ResolveDependency extends NullDependency {
  constructor (resource, packageName, pagesMap, componentsMap, staticResourceMap, publicPath, range) {
    super()
    this.resource = resource
    this.packageName = packageName
    this.pagesMap = pagesMap
    this.componentsMap = componentsMap
    this.staticResourceMap = staticResourceMap
    this.publicPath = publicPath
    this.range = range
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
    const staticResourceMap = dep.staticResourceMap[dep.packageName]
    const resolved = pagesMap[resourcePath] || componentsMap[resourcePath] || staticResourceMap[resourcePath]
    if (!resolved) {
      throw new Error(`Path ${dep.resource} is not a page/component/static resource, can not be resolved!`)
    }
    return JSON.stringify(dep.publicPath + resolved)
  }
}

module.exports = ResolveDependency
