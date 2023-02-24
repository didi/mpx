import { TransformPluginContext } from 'rollup'
import { Options } from '../../options'
import { jsonProcess } from '../../processor/json-process'
import { jsonCompiler } from '@mpxjs/compiler'
import mpx from '../mpx'
import { SFCDescriptor } from '../utils/descriptor-cache'
import { proxyPluginContext } from '@mpxjs/plugin-proxy'

export async function processJSON(
  descriptor: SFCDescriptor,
  options: Options,
  pluginContext: TransformPluginContext
): Promise<void> {
  const jsonConfig = (descriptor.jsonConfig = await jsonCompiler.parse(
    descriptor,
    descriptor.filename,
    proxyPluginContext(pluginContext),
    options
  ))
  try {
    const jsonResult = await jsonProcess({
      jsonConfig,
      pluginContext,
      context: jsonConfig.path || descriptor.filename,
      options,
      mode: 'vite',
      mpx
    })
    descriptor.localPagesMap = jsonResult.localPagesMap
    descriptor.localComponentsMap = jsonResult.localComponentsMap
    descriptor.tabBarMap = jsonResult.tabBarMap
  } catch (error) {
    pluginContext.error(`[mpx] process json error: ${error}`)
  }
}
