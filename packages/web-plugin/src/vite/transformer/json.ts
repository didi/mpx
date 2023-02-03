import { jsonCompiler } from '../../transfrom/json-compiler'
import resolveJson from '../../utils/resolve-json-content'
import mpxGlobal from '../mpx'
import { ResolvedOptions } from '../options'
import { TransformPluginContext } from 'rollup'
import { SFCDescriptor } from '../../types/compiler'

export async function processJSON(
  descriptor: SFCDescriptor,
  options: ResolvedOptions,
  pluginContext: TransformPluginContext
): Promise<void> {
  const jsonConfig = (descriptor.jsonConfig = await resolveJson(descriptor, descriptor.filename, pluginContext, options))
  const { filename } = descriptor

  try {
    const { localPagesMap, localComponentsMap, tabBarMap, tabBarStr } = await jsonCompiler({
      jsonConfig,
      mpx: {
        ...mpxGlobal,
        ...options
      },
      context: filename,
      pluginContext,
      mode: 'vite'
    })
    descriptor.localPagesMap = localPagesMap
    descriptor.localComponentsMap = localComponentsMap
    descriptor.tabBarMap = tabBarMap
    descriptor.tabBarStr = tabBarStr
  } catch (error) {
    pluginContext.error(`[mpx] process json error: ${ error }`)
  }
}
