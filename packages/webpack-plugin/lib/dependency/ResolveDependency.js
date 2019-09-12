'use strict'
const NullDependency = require('webpack/lib/dependencies/NullDependency')
const getResourcePath = require('../utils/get-resource-path')

class ResolveDependency extends NullDependency {
  constructor (resource, packageName, pagesMap, componentsMap, resourceMap, publicPath, range) {
    super()
    this.resource = resource
    this.packageName = packageName
    this.pagesMap = pagesMap
    this.componentsMap = componentsMap
    this.resourceMap = resourceMap
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
    const resourcePath = getResourcePath(dep.resource)
    const pagesMap = dep.pagesMap[dep.packageName]
    const componentsMap = dep.componentsMap[dep.packageName]
    const resourceMap = dep.resourceMap[dep.packageName]
    const resolved = pagesMap[resourcePath] || componentsMap[resourcePath] || resourceMap[resourcePath]
    if (!resolved) {
      throw new Error(`Path ${dep.resource} is not a page/component/static resource, can not be resolved!`)
    }
    return JSON.stringify(dep.publicPath + resolved)
  }
}

module.exports = ResolveDependency
