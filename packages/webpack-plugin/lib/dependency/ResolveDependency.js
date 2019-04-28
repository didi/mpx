'use strict'
const NullDependency = require('webpack/lib/dependencies/NullDependency')

class ResolveDependency extends NullDependency {
  constructor (resource, pagesMap, componentsMap, publicPath, range) {
    super()
    this.resource = resource
    this.pagesMap = pagesMap
    this.componentsMap = componentsMap
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
    const resolved = dep.pagesMap[dep.resource] || dep.componentsMap[dep.resource]
    if (!resolved) {
      throw new Error(`Path ${dep.resource} is neither a component path nor a page path, can not be resolved!`)
    }
    return JSON.stringify(dep.publicPath + resolved)
  }
}

module.exports = ResolveDependency
