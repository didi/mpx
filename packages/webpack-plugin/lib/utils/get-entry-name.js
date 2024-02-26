module.exports = function (loaderContext) {
  if (!loaderContext._compilation) return ''
  const moduleGraph = loaderContext._compilation.moduleGraph
  let entryName = ''
  for (const [name, { dependencies }] of loaderContext._compilation.entries) {
    for (const dep of dependencies) {
      const entryModule = moduleGraph.getModule(dep)
      if (entryModule && entryModule.resource === loaderContext.resource) {
        entryName = name
        break
      }
    }
  }
  return entryName
}
