const componentDependencyInfo = {}

module.exports = {
  addComponentDependencyInfo (resourcePath, tag, options = {}) {
    if (!componentDependencyInfo[resourcePath]) {
      componentDependencyInfo[resourcePath] = {}
    }
    componentDependencyInfo[resourcePath][tag] = options
  },
  getComponentDependencyInfo (resourcePath) {
    if (componentDependencyInfo[resourcePath]) {
      return componentDependencyInfo[resourcePath]
    }
    return {}
  }
}
