module.exports = function (loaderContext) {
  const compilation = loaderContext._compilation
  const moduleGraph = compilation.moduleGraph
  let entryName = ''
  for (const [name, { dependencies }] of compilation.entries) {
    const entryModule = moduleGraph.getModule(dependencies[0])
    if (entryModule.resource === loaderContext.resource) {
      entryName = name
      break
    }
  }
  return entryName
}
