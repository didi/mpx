module.exports = function (loaderContext) {
  if (!loaderContext._compilation) return ''
  const moduleGraph = loaderContext._compilation.moduleGraph
  let entryName = ''
  for (const [name, { dependencies }] of loaderContext._compilation.entries) {
    const entryModule = moduleGraph.getModule(dependencies[0])
    if (entryModule.resource === loaderContext.resource) {
      entryName = name
      break
    }
  }
  return entryName
}
