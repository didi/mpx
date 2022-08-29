import { LoaderContext } from "webpack"

module.exports = function (loaderContext: LoaderContext<any>) {
  if (!loaderContext._compilation) return ''
  const moduleGraph = loaderContext._compilation.moduleGraph
  let entryName = ''
  for (const [name, { dependencies }] of loaderContext._compilation.entries) {
    const entryModule = moduleGraph.getModule(dependencies[0]) as any
    if (entryModule.resource === loaderContext.resource) {
      entryName = name
      break
    }
  }
  return entryName
}
