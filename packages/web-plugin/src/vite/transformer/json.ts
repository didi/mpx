import { TransformPluginContext } from 'rollup'
import { ResolvedOptions } from '../../options'
import { proxyPluginContext } from '../../pluginContextProxy'
import resolveJson from '../../utils/resolve-json-content'
import { SFCDescriptor } from '../../types/compiler'
import mpxGlobal from '../mpx'
import { jsonCompiler } from '../../transfrom/json-compiler'
import getOutputPath from '../../utils/get-output-path'

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
        ...options,
        getOutputPath: getOutputPath
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
    proxyPluginContext(pluginContext).error(`[mpx loader] process json error: ${ error }`)
  }
}
