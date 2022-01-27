const componentDependencyInfo = {}
const globalRuntimeComponents = []

module.exports = {
  addComponentDependencyInfo (resourcePath, tag, options = {}) {
    if (!componentDependencyInfo[resourcePath]) {
      componentDependencyInfo[resourcePath] = {}
    }
    componentDependencyInfo[resourcePath][tag] = options
  },
  getComponentDependencyInfo (resourcePath) {
    const runtimeComponents = [...globalRuntimeComponents]
    if (componentDependencyInfo[resourcePath]) {
      const componentInfo = componentDependencyInfo[resourcePath]
      runtimeComponents.push(...Object.keys(componentInfo).filter(c => componentInfo[c].isRuntimeComponent))
      return {
        componentDependencyInfo: componentInfo,
        runtimeComponents
      }
    }
    return {
      componentDependencyInfo: {},
      runtimeComponents
    }
  },
  addGlobalRuntimeComponents (name) {
    globalRuntimeComponents.push(name)
  },
  getGlobalRuntimeComponents () {
    return globalRuntimeComponents
  }
}
