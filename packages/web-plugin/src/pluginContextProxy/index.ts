import { PluginContext as RollupPluginContext } from 'rollup'
import { NOOP } from '../utils'
import { LoaderDefinition } from 'webpack'
import { ResolvedOptions } from '../options'

export interface ProxyPluginContext {
  resolve(context: string, request: string): Promise<{ id: string } | null>
  addDependency(filename: string): void
  cacheable(): void
  async(): any
  resource?: string
  resourcePath?: string
  sourceMap?: boolean
  warn(warn: any): void,
  error(err: any): void
}

export function proxyPluginContext(
  pluginContext: RollupPluginContext | ThisParameterType<LoaderDefinition>,
  rollupOptions?: {
    moduleId: string
    options: ResolvedOptions
  }
): ProxyPluginContext {
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
      addDependency: pluginContext.addDependency.bind(pluginContext),
      cacheable: pluginContext.cacheable.bind(pluginContext),
      async: pluginContext.async.bind(pluginContext),
      resource: pluginContext.resource,
      sourceMap: pluginContext.sourceMap,
      warn: pluginContext.emitWarning.bind(pluginContext),
      error: pluginContext.emitError.bind(pluginContext)
    }
  } else {
    return {
      resolve: pluginContext.resolve.bind(pluginContext),
      addDependency: pluginContext.addWatchFile.bind(pluginContext),
      warn:pluginContext.warn.bind(pluginContext),
      error: pluginContext.error.bind(pluginContext),
      cacheable: NOOP,
      async: NOOP,
      resource: rollupOptions?.moduleId,
      sourceMap: rollupOptions?.options.sourceMap
    }
  }
}
