import { PluginContext as RollupPluginContext } from 'rollup'
import { LoaderContext } from 'webpack'

export interface PluginContext {
  resolve(context: string, request: string): Promise<{ id: string } | null>
  addWatchFile(filename: string): void
}

export function proxyPluginContext(
  pluginContext: RollupPluginContext | LoaderContext<null>
): PluginContext {
  if ('mode' in pluginContext) {
    return {
      resolve: (request: string, context: string) =>
        new Promise((resolve, reject) => {
          pluginContext.resolve(context, request, (err, res) => {
            if (err) return reject(err)
            resolve({
              id: res as string
            })
          })
        }),
      addWatchFile: (filename: string) => pluginContext.addDependency(filename)
    }
  } else {
    return {
      resolve: pluginContext.resolve.bind(pluginContext),
      addWatchFile: pluginContext.addWatchFile.bind(pluginContext)
    }
  }
}
