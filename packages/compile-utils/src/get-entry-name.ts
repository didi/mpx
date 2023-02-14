import { LoaderContext, NormalModule } from 'webpack'

export function getEntryName (loaderContext: LoaderContext<null>): string {
  if (!loaderContext._compilation) return ''
  const moduleGraph = loaderContext._compilation.moduleGraph
  let entryName = ''
  for (const [name, { dependencies }] of loaderContext._compilation.entries) {
    const entryModule = moduleGraph.getModule(dependencies[0]) as NormalModule
    if (entryModule && entryModule.resource === loaderContext.resource) {
      entryName = name
      break
    }
  }
  return entryName
}
